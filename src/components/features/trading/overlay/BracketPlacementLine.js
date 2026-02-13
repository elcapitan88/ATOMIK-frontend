import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import TradingLineLabel from './TradingLineLabel';

/**
 * Draggable horizontal line for bracket order placement.
 *
 * Three types:
 *   - entry: solid side-colored line with side toggle + submit button
 *   - tp:    dashed green line (take profit)
 *   - sl:    dashed red line (stop loss)
 *
 * Styled to match native OrderLine appearance (dark pill labels, side-based colors).
 * Drag behavior mirrors OrderLine: mousedown -> document mousemove -> mouseup.
 */

// TP and SL have fixed colors; entry color is dynamic based on side
const LINE_COLORS = {
  tp: '#4caf50',
  sl: '#f44336',
};

const SIDE_COLORS = {
  BUY: '#26a69a',
  SELL: '#ef5350',
};

const getLineColor = (type, side) => {
  if (type === 'entry') return SIDE_COLORS[side] || SIDE_COLORS.BUY;
  return LINE_COLORS[type] || '#888';
};

const getLabel = (type, side, totalQuantity) => {
  const qty = totalQuantity || 1;
  if (type === 'entry') return `${side} LMT \u00d7 ${qty}`;
  if (type === 'tp') return `TP LMT \u00d7 ${qty}`;
  if (type === 'sl') return `SL STP \u00d7 ${qty}`;
  return type.toUpperCase();
};

const BracketPlacementLine = memo(({
  type,
  price,
  yPosition,
  chartWidth,
  visible,
  yToPrice,
  roundToTick,
  formatPrice,
  symbol,
  side,
  onDrag,
  onDragStateChange,
  onSubmit,
  onToggleSide,
  onCancel,
  totalQuantity,
  overlayRef,
}) => {
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const dragStartRef = useRef(null);
  const lineRef = useRef(null);

  const color = getLineColor(type, side);
  const isDashed = type === 'tp' || type === 'sl';

  // Compute drag price for display
  const currentY = yPosition + dragOffsetY;
  const dragPrice = isDragging && yToPrice ? roundToTick(yToPrice(currentY), symbol) : null;
  const dragFormattedPrice = dragPrice != null ? formatPrice(dragPrice, symbol) : null;

  // Display price
  const displayPrice = isDragging && dragFormattedPrice != null
    ? `$${dragFormattedPrice}`
    : `$${formatPrice(price, symbol)}`;

  const labelText = getLabel(type, side, totalQuantity);

  // ── Drag handlers (before any conditional returns) ─────────────────

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // left-click only
    e.preventDefault();
    e.stopPropagation();

    dragStartRef.current = {
      clientY: e.clientY,
      originalY: yPosition,
    };

    setIsDragging(true);
    setDragOffsetY(0);
    onDragStateChange?.(true);
  }, [yPosition, onDragStateChange]);

  // Document-level mousemove and mouseup while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!dragStartRef.current) return;
      const delta = e.clientY - dragStartRef.current.clientY;
      setDragOffsetY(delta);
    };

    const handleMouseUp = (e) => {
      if (!dragStartRef.current) return;

      const delta = e.clientY - dragStartRef.current.clientY;
      const finalY = dragStartRef.current.originalY + delta;

      setIsDragging(false);
      setDragOffsetY(0);
      onDragStateChange?.(false);

      // Only trigger if the price actually changed
      if (Math.abs(delta) > 2 && yToPrice) {
        const newRawPrice = yToPrice(finalY);
        const snapped = roundToTick(newRawPrice, symbol);
        if (snapped !== price) {
          onDrag(snapped);
        }
      }

      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, yToPrice, roundToTick, symbol, price, onDrag, onDragStateChange]);

  // ── Early returns AFTER all hooks ─────────────────────────────────

  if (!visible && !isDragging) return null;
  if (yPosition < -200 || yPosition > 5000) return null;

  // Determine effective Y for rendering
  const effectiveY = isDragging ? yPosition + dragOffsetY : yPosition;

  return (
    <>
      {/* Ghost line at original position during drag */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            transform: `translateY(${yPosition}px)`,
            pointerEvents: 'none',
            zIndex: 8,
            opacity: 0.3,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: '80px',
              height: '1px',
              top: '0px',
              backgroundColor: color,
            }}
          />
        </div>
      )}

      {/* Main line */}
      <div
        ref={lineRef}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${effectiveY}px)`,
          pointerEvents: 'auto',
          zIndex: isDragging ? 15 : 9,
          cursor: 'ns-resize',
          willChange: 'transform',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => !isDragging && setHovered(false)}
      >
        {/* Hit area — taller invisible zone for easy grabbing */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: '80px',
            height: '11px',
            top: '-5px',
            cursor: 'ns-resize',
          }}
        />

        {/* Horizontal line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: '80px',
            height: '1px',
            top: '0px',
            background: isDashed
              ? undefined
              : color,
            backgroundImage: isDashed
              ? `repeating-linear-gradient(to right, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)`
              : undefined,
            opacity: isDragging ? 1 : 0.7,
            boxShadow: isDragging ? `0 0 6px ${color}` : 'none',
          }}
        />

        {/* Label + action buttons — positioned right-center */}
        <div
          style={{
            position: 'absolute',
            right: '84px',
            top: '-10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {/* Cancel (×) button — shows on hover */}
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCancel?.(); }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Cancel bracket"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              lineHeight: 1,
              padding: 0,
              color: '#ffffff',
              backgroundColor: 'rgba(239, 83, 80, 0.8)',
              opacity: hovered || isDragging ? 1 : 0,
              transition: 'opacity 0.15s',
              pointerEvents: hovered || isDragging ? 'auto' : 'none',
            }}
          >
            ×
          </button>

          {/* Label pill — matches native OrderLine styling */}
          <TradingLineLabel
            text={labelText}
            price={displayPrice}
            color={color}
            bodyColor={isDragging ? color : '#2a2e39'}
            textColor={isDragging ? '#ffffff' : '#d1d4dc'}
          />

          {/* Entry line only: side toggle + submit button */}
          {type === 'entry' && (
            <>
              {/* Side toggle */}
              {onToggleSide && (
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleSide(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={`Switch to ${side === 'BUY' ? 'SELL' : 'BUY'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '20px',
                    padding: '0 6px',
                    borderRadius: '3px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    backgroundColor: side === 'BUY'
                      ? 'rgba(38, 166, 154, 0.7)'
                      : 'rgba(239, 83, 80, 0.7)',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {side === 'BUY' ? 'BUY' : 'SELL'} ↕
                </button>
              )}

              {/* Submit button */}
              {onSubmit && (
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onSubmit(side); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Place bracket order"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '20px',
                    padding: '0 8px',
                    borderRadius: '3px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    backgroundColor: side === 'BUY'
                      ? 'rgba(38, 166, 154, 0.9)'
                      : 'rgba(239, 83, 80, 0.9)',
                    transition: 'background-color 0.15s',
                  }}
                >
                  Submit ▸
                </button>
              )}
            </>
          )}
        </div>

        {/* Y-axis price tag */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '-9px',
            width: '78px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color,
            borderRadius: '2px',
            zIndex: 11,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: '#ffffff',
              letterSpacing: '0.2px',
            }}
          >
            {isDragging && dragFormattedPrice != null ? dragFormattedPrice : formatPrice(price, symbol)}
          </span>
        </div>

        {/* Floating price tooltip during drag */}
        {isDragging && dragFormattedPrice != null && (
          <div
            style={{
              position: 'absolute',
              right: '4px',
              top: '-11px',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: color,
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
              zIndex: 20,
            }}
          >
            ${dragFormattedPrice}
          </div>
        )}
      </div>
    </>
  );
});

BracketPlacementLine.displayName = 'BracketPlacementLine';

export default BracketPlacementLine;
