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

  // Refs so we never stale-close over them inside rAF
  const paneRef = useRef(null);
  const priceScaleRef = useRef(null);
  const rafIdRef = useRef(null);
  const lastRangeRef = useRef({ from: 0, to: 0 });
  const lastHeightRef = useRef(0);
  const lastWidthRef = useRef(0);
  const isLogRef = useRef(false);

  // ── Initialise pane + priceScale refs ──────────────────────────────
  useEffect(() => {
    if (!activeChart) {
      setIsReady(false);
      return;
    }

    let cancelled = false;

    const init = () => {
      try {
        const panes = activeChart.getPanes();
        if (!panes || panes.length === 0) return;

        const pane = panes[0];
        const ps = pane.getMainSourcePriceScale();
        if (!ps) return;

        paneRef.current = pane;
        priceScaleRef.current = ps;

        // Detect log scale: PriceScaleMode.Log = 1
        try {
          isLogRef.current = ps.getMode() === 1;
        } catch (e) {
          isLogRef.current = false;
        }

        if (!cancelled) setIsReady(true);
      } catch (e) {
        console.warn('[useChartCoordinates] init failed, retrying...', e);
        // Pane may not be ready yet — retry once
        setTimeout(() => {
          if (cancelled) return;
          try {
            const panes = activeChart.getPanes();
            if (!panes || panes.length === 0) return;
            paneRef.current = panes[0];
            priceScaleRef.current = panes[0].getMainSourcePriceScale();
            if (priceScaleRef.current && !cancelled) setIsReady(true);
          } catch (e2) {
            console.warn('[useChartCoordinates] init retry failed:', e2);
          }
        }, 500);
      }
    };

    init();
    return () => { cancelled = true; };
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

  // ── Also subscribe to onVisibleRangeChanged as backup trigger ──────
  useEffect(() => {
    if (!activeChart || !isReady) return;

    let sub;
    try {
      sub = activeChart.onVisibleRangeChanged();
      sub.subscribe(null, () => {
        // The rAF loop will pick up the change, but this ensures
        // we don't miss fast scrolls where rAF might skip a frame.
        const ps = priceScaleRef.current;
        if (!ps) return;
        const range = ps.getVisiblePriceRange();
        if (range) {
          lastRangeRef.current = { from: range.from, to: range.to };
          setVisiblePriceRange({ from: range.from, to: range.to });
        }
      });
    } catch (e) {
      console.warn('[useChartCoordinates] Could not subscribe to onVisibleRangeChanged:', e);
    }

    return () => {
      // The CL subscription API doesn't expose unsubscribe easily,
      // but the chart cleanup handles it when the widget is destroyed.
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
  };
};

export default useChartCoordinates;
