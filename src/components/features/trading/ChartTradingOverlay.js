import React, { memo, useState, useCallback, useRef } from 'react';
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
      }}
      onMouseDown={isAwaitingClick ? (e) => {
        if (e.button !== 0) return; // left-click only
        e.preventDefault();
        e.stopPropagation();
        const rect = overlayRef.current?.getBoundingClientRect();
        if (!rect) return;
        const y = e.clientY - rect.top;
        const price = yToPrice(y);
        if (price != null && price > 0) {
          // Use currentPrice, or approximate market price from chart midpoint
          const marketPrice = currentPrice ?? yToPrice(paneHeight / 2);
          console.log('[BracketOverlay] Click at y=%d, price=%d, marketPrice=%d', y, price, marketPrice);
          bracketPlacement.placeEntry(price, marketPrice);
        }
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
        />
      )}
    </div>
  );
});

ChartTradingOverlay.displayName = 'ChartTradingOverlay';

export default ChartTradingOverlay;
