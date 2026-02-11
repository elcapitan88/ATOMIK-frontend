import React, { memo, useState, useCallback, useRef } from 'react';
import useChartCoordinates from '@/hooks/useChartCoordinates';
import PositionLine from './overlay/PositionLine';
import OrderLine from './overlay/OrderLine';
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
}) => {
  const overlayRef = useRef(null);
  const [isDraggingOrder, setIsDraggingOrder] = useState(false);

  const {
    priceToY,
    yToPrice,
    isPriceVisible,
    paneHeight,
    chartWidth,
    toolbarHeight,
    isReady,
  } = useChartCoordinates(activeChart);

  // When an order starts/stops dragging, toggle overlay pointer-events
  const handleDragStateChange = useCallback((dragging) => {
    setIsDraggingOrder(dragging);
  }, []);

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
        pointerEvents: isDraggingOrder ? 'auto' : 'none',
        overflow: 'hidden',
        zIndex: 10,
        // Prevent any text selection during drag
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
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
    </div>
  );
});

ChartTradingOverlay.displayName = 'ChartTradingOverlay';

export default ChartTradingOverlay;
