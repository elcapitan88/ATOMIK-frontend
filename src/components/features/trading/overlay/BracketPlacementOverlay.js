import React, { memo } from 'react';
import BracketPlacementLine from './BracketPlacementLine';
import { roundToTick, formatPrice } from '@/hooks/useChartTrading';

/**
 * Container that renders the 3 bracket placement lines (entry, TP, SL)
 * when bracketPlacement.isPlaced is true.
 *
 * Each line is independently draggable and updates the bracket placement state.
 */
const BracketPlacementOverlay = memo(({
  bracketPlacement,
  priceToY,
  yToPrice,
  isPriceVisible,
  chartWidth,
  onDragStateChange,
  overlayRef,
  totalQuantity,
}) => {
  if (!bracketPlacement || !bracketPlacement.isPlaced) return null;

  const symbol = bracketPlacement.symbol || 'NQ';

  return (
    <>
      {/* Entry line */}
      <BracketPlacementLine
        type="entry"
        price={bracketPlacement.entryPrice}
        yPosition={priceToY(bracketPlacement.entryPrice)}
        chartWidth={chartWidth}
        visible={isPriceVisible(bracketPlacement.entryPrice)}
        yToPrice={yToPrice}
        roundToTick={roundToTick}
        formatPrice={formatPrice}
        symbol={symbol}
        side={bracketPlacement.side}
        onDrag={(newPrice) => bracketPlacement.updateEntry(newPrice)}
        onDragStateChange={onDragStateChange}
        onSubmit={(side) => bracketPlacement.submit(side)}
        onToggleSide={bracketPlacement.toggleSide}
        onCancel={bracketPlacement.deactivate}
        totalQuantity={totalQuantity}
        overlayRef={overlayRef}
      />

      {/* Take profit line */}
      <BracketPlacementLine
        type="tp"
        price={bracketPlacement.tpPrice}
        yPosition={priceToY(bracketPlacement.tpPrice)}
        chartWidth={chartWidth}
        visible={isPriceVisible(bracketPlacement.tpPrice)}
        yToPrice={yToPrice}
        roundToTick={roundToTick}
        formatPrice={formatPrice}
        symbol={symbol}
        side={bracketPlacement.side}
        onDrag={(newPrice) => bracketPlacement.updateTp(newPrice)}
        onDragStateChange={onDragStateChange}
        onCancel={bracketPlacement.deactivate}
        totalQuantity={totalQuantity}
        overlayRef={overlayRef}
      />

      {/* Stop loss line */}
      <BracketPlacementLine
        type="sl"
        price={bracketPlacement.slPrice}
        yPosition={priceToY(bracketPlacement.slPrice)}
        chartWidth={chartWidth}
        visible={isPriceVisible(bracketPlacement.slPrice)}
        yToPrice={yToPrice}
        roundToTick={roundToTick}
        formatPrice={formatPrice}
        symbol={symbol}
        side={bracketPlacement.side}
        onDrag={(newPrice) => bracketPlacement.updateSl(newPrice)}
        onDragStateChange={onDragStateChange}
        onCancel={bracketPlacement.deactivate}
        totalQuantity={totalQuantity}
        overlayRef={overlayRef}
      />
    </>
  );
});

BracketPlacementOverlay.displayName = 'BracketPlacementOverlay';

export default BracketPlacementOverlay;
