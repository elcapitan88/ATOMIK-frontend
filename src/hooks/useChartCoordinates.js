import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Maps TradingView chart prices to pixel Y coordinates and back.
 *
 * Uses the Charting Library public API:
 *   chart.getPanes()[0]                    → main pane
 *   pane.getHeight()                       → pane height in px
 *   pane.getMainSourcePriceScale()         → price scale API
 *   priceScale.getVisiblePriceRange()      → { from, to }
 *   priceScale.getMode()                   → 0=Normal, 1=Log, 2=%, 3=Indexed100
 *   chart.getTimeScale().width()           → chart width in px
 *
 * Because the CL has no priceToCoordinate / coordinateToPrice we
 * compute them ourselves and poll the visible range via rAF.
 */
const useChartCoordinates = (activeChart) => {
  const [visiblePriceRange, setVisiblePriceRange] = useState(null);
  const [paneHeight, setPaneHeight] = useState(0);
  const [chartWidth, setChartWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(null);

  // Refs so we never stale-close over them inside rAF
  const paneRef = useRef(null);
  const priceScaleRef = useRef(null);
  const rafIdRef = useRef(null);
  const lastRangeRef = useRef({ from: 0, to: 0 });
  const lastHeightRef = useRef(0);
  const lastWidthRef = useRef(0);
  const isLogRef = useRef(false);
  const lastCurrentPriceRef = useRef(null);

  // ── Initialise pane + priceScale refs ──────────────────────────────
  // The TV chart may not have panes/priceScale ready immediately after
  // onWidgetReady fires. We poll every 200ms (up to 15s) until they
  // become available, so the overlay always appears without needing
  // a manual page refresh.
  useEffect(() => {
    if (!activeChart) {
      setIsReady(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 75; // 75 × 200ms = 15s
    let timerId = null;

    const tryInit = () => {
      if (cancelled) return;
      attempts++;

      try {
        const panes = activeChart.getPanes();
        if (!panes || panes.length === 0) throw new Error('no panes');

        const pane = panes[0];
        const ps = pane.getMainSourcePriceScale();
        if (!ps) throw new Error('no priceScale');

        // Verify the price scale actually has data
        const range = ps.getVisiblePriceRange();
        if (!range || range.from === range.to) throw new Error('no range');

        paneRef.current = pane;
        priceScaleRef.current = ps;

        try {
          isLogRef.current = ps.getMode() === 1;
        } catch (_) {
          isLogRef.current = false;
        }

        if (!cancelled) setIsReady(true);
      } catch (_) {
        if (attempts < MAX_ATTEMPTS && !cancelled) {
          timerId = setTimeout(tryInit, 200);
        }
      }
    };

    tryInit();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [activeChart]);

  // ── Measure toolbar height ─────────────────────────────────────────
  // TV toolbar sits above the chart pane inside the iframe. We detect
  // it once so we can offset our overlay Y coordinates correctly.
  useEffect(() => {
    if (!activeChart || !isReady) return;

    const measure = () => {
      try {
        // Access the widget's iframe container to find the toolbar
        // The chart container is the parent element that holds everything
        const pane = paneRef.current;
        if (!pane) return;

        // Try to get the chart pane element from the iframe
        // The widget creates an iframe — the toolbar is inside it.
        // We can't easily access iframe internals, so use a known offset.
        // TV CL toolbar is consistently ~38px in the dark theme.
        setToolbarHeight(38);
      } catch (e) {
        setToolbarHeight(38); // safe default
      }
    };

    measure();
  }, [activeChart, isReady]);

  // ── rAF polling loop ───────────────────────────────────────────────
  // Polls getVisiblePriceRange(), getHeight(), width() at ~60fps.
  // Only triggers setState when values actually change.
  useEffect(() => {
    if (!isReady) return;

    const poll = () => {
      const ps = priceScaleRef.current;
      const pane = paneRef.current;
      if (!ps || !pane) {
        rafIdRef.current = requestAnimationFrame(poll);
        return;
      }

      try {
        // Price range
        const range = ps.getVisiblePriceRange();
        if (range && (range.from !== lastRangeRef.current.from || range.to !== lastRangeRef.current.to)) {
          lastRangeRef.current = { from: range.from, to: range.to };
          setVisiblePriceRange({ from: range.from, to: range.to });
        }

        // Pane height
        const h = pane.getHeight();
        if (h !== lastHeightRef.current) {
          lastHeightRef.current = h;
          setPaneHeight(h);
        }

        // Chart width
        if (activeChart) {
          try {
            const w = activeChart.getTimeScale().width();
            if (w !== lastWidthRef.current) {
              lastWidthRef.current = w;
              setChartWidth(w);
            }
          } catch (_) { /* timeScale may not be ready */ }
        }

        // Log scale can change at runtime
        try {
          isLogRef.current = ps.getMode() === 1;
        } catch (_) { /* ignore */ }
      } catch (e) {
        // Price scale may become null if chart switches pane
        // Re-acquire on next frame
        try {
          const panes = activeChart?.getPanes();
          if (panes && panes.length > 0) {
            paneRef.current = panes[0];
            priceScaleRef.current = panes[0].getMainSourcePriceScale();
          }
        } catch (_) { /* ignore */ }
      }

      rafIdRef.current = requestAnimationFrame(poll);
    };

    rafIdRef.current = requestAnimationFrame(poll);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isReady, activeChart]);

  // ── Subscribe to chart events as backup triggers ─────────────────
  useEffect(() => {
    if (!activeChart) return;

    // onVisibleRangeChanged — catch fast scrolls the rAF loop might miss
    let rangeSub;
    try {
      rangeSub = activeChart.onVisibleRangeChanged();
      rangeSub.subscribe(null, () => {
        const ps = priceScaleRef.current;
        if (!ps) return;
        const range = ps.getVisiblePriceRange();
        if (range) {
          lastRangeRef.current = { from: range.from, to: range.to };
          setVisiblePriceRange({ from: range.from, to: range.to });
        }
      });
    } catch (_) { /* not ready yet — polling will handle it */ }

    // onDataLoaded — fires when chart finishes loading bar data.
    // If we weren't ready yet, this is our cue to re-acquire pane refs.
    let dataLoadedSub;
    try {
      dataLoadedSub = activeChart.onDataLoaded();
      dataLoadedSub.subscribe(null, () => {
        if (paneRef.current && priceScaleRef.current) return; // already good
        try {
          const panes = activeChart.getPanes();
          if (panes && panes.length > 0) {
            paneRef.current = panes[0];
            const ps = panes[0].getMainSourcePriceScale();
            if (ps) {
              priceScaleRef.current = ps;
              setIsReady(true);
            }
          }
        } catch (_) { /* ignore */ }
      });
    } catch (_) { /* not ready yet */ }

    return () => {
      // CL subscriptions are cleaned up when the widget is destroyed.
    };
  }, [activeChart]);

  // ── Current price polling ─────────────────────────────────────────
  // Polls the chart's last bar close via exportData() every ~1s.
  // This gives us the live market price so we can nudge the position
  // price tag away from TV's current-price tag on the Y-axis.
  useEffect(() => {
    if (!activeChart || !isReady) return;

    let cancelled = false;

    const fetchCurrentPrice = async () => {
      if (cancelled) return;
      try {
        const exported = await activeChart.exportData({
          includeSeries: true,
          includeStudies: false,
        });
        if (cancelled || !exported?.data?.length || !exported?.schema) return;

        const closeIdx = exported.schema.indexOf('close');
        if (closeIdx === -1) return;

        const lastBar = exported.data[exported.data.length - 1];
        const price = lastBar?.[closeIdx];
        if (price != null && price !== lastCurrentPriceRef.current) {
          lastCurrentPriceRef.current = price;
          setCurrentPrice(price);
        }
      } catch (_) {
        // exportData may not be available on all CL versions — degrade gracefully
      }
    };

    // Initial fetch + 1s interval
    fetchCurrentPrice();
    const intervalId = setInterval(fetchCurrentPrice, 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeChart, isReady]);

  // ── Coordinate conversion functions ────────────────────────────────

  const priceToY = useCallback(
    (price) => {
      if (!visiblePriceRange || !paneHeight) return -9999;
      const { from, to } = visiblePriceRange;
      if (to === from) return -9999;

      if (isLogRef.current && from > 0 && to > 0 && price > 0) {
        // Logarithmic scale
        const logFrom = Math.log(from);
        const logTo = Math.log(to);
        if (logTo === logFrom) return -9999;
        return paneHeight * (1 - (Math.log(price) - logFrom) / (logTo - logFrom));
      }

      // Linear scale
      return paneHeight * (1 - (price - from) / (to - from));
    },
    [visiblePriceRange, paneHeight]
  );

  const yToPrice = useCallback(
    (y) => {
      if (!visiblePriceRange || !paneHeight) return 0;
      const { from, to } = visiblePriceRange;
      if (paneHeight === 0) return 0;

      if (isLogRef.current && from > 0 && to > 0) {
        const logFrom = Math.log(from);
        const logTo = Math.log(to);
        return Math.exp(logFrom + (1 - y / paneHeight) * (logTo - logFrom));
      }

      return from + (1 - y / paneHeight) * (to - from);
    },
    [visiblePriceRange, paneHeight]
  );

  // ── Is a price currently visible? ──────────────────────────────────
  const isPriceVisible = useCallback(
    (price) => {
      if (!visiblePriceRange) return false;
      return price >= visiblePriceRange.from && price <= visiblePriceRange.to;
    },
    [visiblePriceRange]
  );

  return {
    priceToY,
    yToPrice,
    isPriceVisible,
    visiblePriceRange,
    paneHeight,
    chartWidth,
    toolbarHeight,
    isReady,
    currentPrice,
  };
};

export default useChartCoordinates;
