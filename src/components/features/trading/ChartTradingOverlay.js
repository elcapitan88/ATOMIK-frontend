import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import useChartCoordinates from '@/hooks/useChartCoordinates';
import PositionLine from './overlay/PositionLine';
import OrderLine from './overlay/OrderLine';
import BracketPlacementOverlay from './overlay/BracketPlacementOverlay';
import { roundToTick, formatPrice } from '@/hooks/useChartTrading';

/**
 * Overlay container that renders position and order lines on top of
 * the TradingView chart.
 *
 * Sits absolutely positioned over the chart iframe. Uses pointer-events:none
 * so chart interaction passes through. Individual lines have pointer-events:auto.
 *
 * During order drag, pointer-events switches to 'auto' on the full overlay
 * so the mouse can't escape to the iframe mid-drag.
 */
const ChartTradingOverlay = memo(({
  activeChart,
  positionLines = [],
  orderLines = [],
  bracketPlacement,
  totalQuantity,
  isMobile = false,
  autoBracket,
  onLongPress,
}) => {
  const overlayRef = useRef(null);
  const [isDraggingOrder, setIsDraggingOrder] = useState(false);
  const [isDraggingBracket, setIsDraggingBracket] = useState(false);

  const {
    priceToY,
    yToPrice,
    isPriceVisible,
    paneHeight,
    chartWidth,
    toolbarHeight,
    isReady,
    currentPrice,
  } = useChartCoordinates(activeChart);

  // Compute the Y position of the current market price tag on the axis
  const currentPriceY = currentPrice != null ? priceToY(currentPrice) : null;

  // When an order starts/stops dragging, toggle overlay pointer-events
  const handleDragStateChange = useCallback((dragging) => {
    setIsDraggingOrder(dragging);
  }, []);

  const handleBracketDragStateChange = useCallback((dragging) => {
    setIsDraggingBracket(dragging);
  }, []);

  const isAwaitingClick = bracketPlacement?.isActive && !bracketPlacement?.isPlaced;
  const hasBracketLines = bracketPlacement?.isPlaced;

  // Long-press handling for mobile (500ms hold → action sheet)
  const longPressTimerRef = useRef(null);
  const longPressTouchRef = useRef(null);

  const handleTouchStartLongPress = useCallback((e) => {
    if (!isMobile || isAwaitingClick) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    longPressTouchRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect || !longPressTouchRef.current) return;
      const y = longPressTouchRef.current.y - rect.top;
      const price = yToPrice(y);
      if (price != null && price > 0) {
        onLongPress?.(price);
      }
      longPressTouchRef.current = null;
    }, 500);
  }, [isMobile, isAwaitingClick, yToPrice, onLongPress]);

  const handleTouchMoveLongPress = useCallback((e) => {
    if (!longPressTouchRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - longPressTouchRef.current.x);
    const dy = Math.abs(touch.clientY - longPressTouchRef.current.y);
    // Cancel if finger moved more than 10px (user is scrolling/dragging)
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTouchRef.current = null;
    }
  }, []);

  const handleTouchEndLongPress = useCallback(() => {
    clearTimeout(longPressTimerRef.current);
    longPressTouchRef.current = null;
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(longPressTimerRef.current);
  }, []);

  // Handle placement via coordinates (shared by mouse + touch)
  const handlePlaceAtY = useCallback((clientY) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = clientY - rect.top;
    const price = yToPrice(y);
    if (price != null && price > 0) {
      const marketPrice = currentPrice ?? yToPrice(paneHeight / 2);
      bracketPlacement.placeEntry(price, marketPrice);
    }
  }, [yToPrice, currentPrice, paneHeight, bracketPlacement]);

  // Don't render until coordinate system is ready
  if (!isReady || !paneHeight) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: `${toolbarHeight}px`,
        left: 0,
        right: 0,
        height: `${paneHeight}px`,
        pointerEvents: (isDraggingOrder || isDraggingBracket || isAwaitingClick) ? 'auto' : 'none',
        cursor: isAwaitingClick ? 'crosshair' : undefined,
        overflow: 'hidden',
        zIndex: 10,
        // Prevent any text selection during drag
        userSelect: 'none',
        WebkitUserSelect: 'none',
        // Prevent iOS callout on long press during bracket mode
        WebkitTouchCallout: isAwaitingClick ? 'none' : undefined,
      }}
      onMouseDown={isAwaitingClick ? (e) => {
        if (e.button !== 0) return; // left-click only
        e.preventDefault();
        e.stopPropagation();
        handlePlaceAtY(e.clientY);
      } : undefined}
      onTouchEnd={isAwaitingClick ? (e) => {
        // Use touchend for tap-to-place on mobile (touchstart would conflict with scroll)
        if (e.changedTouches.length !== 1) return;
        e.preventDefault();
        e.stopPropagation();
        handlePlaceAtY(e.changedTouches[0].clientY);
      } : undefined}
      data-testid="chart-trading-overlay"
    >
      {/* Position lines */}
      {positionLines.map((pos) => {
        const y = priceToY(pos.price);
        return (
          <PositionLine
            key={pos.key}
            data={pos}
            yPosition={y}
            chartWidth={chartWidth}
            visible={isPriceVisible(pos.price)}
            currentPriceY={currentPriceY}
          />
        );
      })}

      {/* Order lines */}
      {orderLines.map((ord) => {
        const y = priceToY(ord.price);
        return (
          <OrderLine
            key={ord.key}
            data={ord}
            yPosition={y}
            chartWidth={chartWidth}
            visible={isPriceVisible(ord.price)}
            yToPrice={yToPrice}
            roundToTick={roundToTick}
            formatPrice={formatPrice}
            onDragStateChange={handleDragStateChange}
            overlayRef={overlayRef}
          />
        );
      })}

      {/* Bracket placement lines */}
      {bracketPlacement?.isPlaced && (
        <BracketPlacementOverlay
          bracketPlacement={bracketPlacement}
          priceToY={priceToY}
          yToPrice={yToPrice}
          isPriceVisible={isPriceVisible}
          chartWidth={chartWidth}
          onDragStateChange={handleBracketDragStateChange}
          overlayRef={overlayRef}
          totalQuantity={totalQuantity}
          isMobile={isMobile}
        />
      )}

      {/* Mobile long-press capture layer — transparent, only captures touch events */}
      {isMobile && onLongPress && !isAwaitingClick && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            zIndex: 0,
          }}
          onTouchStart={handleTouchStartLongPress}
          onTouchMove={handleTouchMoveLongPress}
          onTouchEnd={handleTouchEndLongPress}
          onTouchCancel={handleTouchEndLongPress}
        />
      )}
    </div>
  );
});

ChartTradingOverlay.displayName = 'ChartTradingOverlay';

export default ChartTradingOverlay;
