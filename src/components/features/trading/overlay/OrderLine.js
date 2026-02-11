import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import TradingLineLabel from './TradingLineLabel';

/**
 * HTML overlay order line with drag-to-modify.
 *
 * Features:
 *  - Horizontal line (solid for LIMIT, dashed for STOP)
 *  - Label pill with side + type + qty
 *  - Cancel button (×)
 *  - Full drag-to-modify: mousedown → mousemove → mouseup triggers onModify
 *  - Price snaps to tick size during drag via roundToTick
 *  - Ghost line shows original price while dragging
 */

const OrderLine = memo(({
  data,
  yPosition,
  chartWidth,
  visible,
  yToPrice,
  roundToTick,
  formatPrice,
  onDragStateChange,
  overlayRef,
}) => {
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const dragStartRef = useRef(null);
  const lineRef = useRef(null);

  const {
    side, shortType, quantity, accountNickname,
    formattedPrice, color, isDashed, symbol,
    price: originalPrice,
    onCancel, onModify,
  } = data;

  const labelText = accountNickname
    ? `${side} ${shortType} × ${quantity} [${accountNickname}]`
    : `${side} ${shortType} × ${quantity}`;

  // Compute the drag price for display
  const currentY = yPosition + dragOffsetY;
  const dragPrice = isDragging && yToPrice ? roundToTick(yToPrice(currentY), symbol) : null;
  const dragFormattedPrice = dragPrice != null ? `$${formatPrice(dragPrice, symbol)}` : null;

  // ── Drag handlers (must come before any conditional returns) ───────

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

      // Only trigger modify if the price actually changed
      if (Math.abs(delta) > 2 && yToPrice) {
        const newRawPrice = yToPrice(finalY);
        const snapped = roundToTick(newRawPrice, symbol);
        if (snapped !== originalPrice) {
          onModify(snapped);
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
  }, [isDragging, yToPrice, roundToTick, symbol, originalPrice, onModify, onDragStateChange]);

  // ── Early returns AFTER all hooks ──────────────────────────────────

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

      {/* Main order line */}
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
        {/* Hover/drag hit area — taller than the visual line for easy grabbing */}
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

        {/* Label + cancel button — positioned right-center */}
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
          {/* Cancel button */}
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCancel(); }}
            onMouseDown={(e) => e.stopPropagation()} // Don't start drag on cancel click
            title="Cancel order"
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

          {/* Label pill */}
          <TradingLineLabel
            text={labelText}
            price={isDragging && dragFormattedPrice ? dragFormattedPrice : `$${formattedPrice}`}
            color={color}
            bodyColor={isDragging ? color : '#2a2e39'}
            textColor={isDragging ? '#ffffff' : '#d1d4dc'}
          />
        </div>

        {/* Floating price tooltip during drag */}
        {isDragging && dragFormattedPrice && (
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
            {dragFormattedPrice}
          </div>
        )}
      </div>
    </>
  );
});

OrderLine.displayName = 'OrderLine';

export default OrderLine;
