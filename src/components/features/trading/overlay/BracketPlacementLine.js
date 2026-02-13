import React, { memo, useState, useRef, useCallback, useEffect } from 'react';

/**
 * Draggable horizontal line for bracket order placement.
 *
 * Three types:
 *   - entry: solid purple line with BUY/SELL buttons
 *   - tp:    dashed green line (take profit)
 *   - sl:    dashed red line (stop loss)
 *
 * Drag behavior mirrors OrderLine: mousedown -> document mousemove -> mouseup.
 * Ghost line at original price during drag; price tooltip on Y-axis.
 */

const TYPE_CONFIG = {
  entry: {
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.85)',
    axisColor: '#5b21b6',
    isDashed: false,
  },
  tp: {
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.85)',
    axisColor: '#2e7d32',
    isDashed: true,
  },
  sl: {
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.85)',
    axisColor: '#c62828',
    isDashed: true,
  },
};

const LABEL_TEXT = {
  entry: (side) => `${side === 'BUY' ? 'BUY' : 'SELL'} LMT`,
  tp: () => 'TP',
  sl: () => 'SL',
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
  overlayRef,
}) => {
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const dragStartRef = useRef(null);
  const lineRef = useRef(null);

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.entry;

  // Compute drag price for display
  const currentY = yPosition + dragOffsetY;
  const dragPrice = isDragging && yToPrice ? roundToTick(yToPrice(currentY), symbol) : null;
  const dragFormattedPrice = dragPrice != null ? formatPrice(dragPrice, symbol) : null;

  // Display price
  const displayPrice = isDragging && dragFormattedPrice != null
    ? dragFormattedPrice
    : formatPrice(price, symbol);

  const labelText = LABEL_TEXT[type] ? LABEL_TEXT[type](side) : type.toUpperCase();

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
              backgroundColor: cfg.color,
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
            background: cfg.isDashed
              ? undefined
              : cfg.color,
            backgroundImage: cfg.isDashed
              ? `repeating-linear-gradient(to right, ${cfg.color} 0, ${cfg.color} 4px, transparent 4px, transparent 8px)`
              : undefined,
            opacity: isDragging ? 1 : 0.7,
            boxShadow: isDragging ? `0 0 6px ${cfg.color}` : 'none',
          }}
        />

        {/* Label + buttons — positioned right-center */}
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
          {/* Label pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: cfg.bgColor,
              border: `1px solid ${cfg.color}`,
              whiteSpace: 'nowrap',
              userSelect: 'none',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: '#ffffff',
              lineHeight: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            <span>{labelText}</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
              ${displayPrice}
            </span>
          </div>

          {/* BUY / SELL buttons — entry line only */}
          {type === 'entry' && onSubmit && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onSubmit('BUY'); }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '20px',
                  padding: '0 8px',
                  borderRadius: '3px',
                  border: side === 'BUY' ? 'none' : '1px solid rgba(38, 166, 154, 0.6)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  backgroundColor: side === 'BUY'
                    ? 'rgba(38, 166, 154, 0.9)'
                    : 'rgba(38, 166, 154, 0.3)',
                  transition: 'background-color 0.15s',
                }}
              >
                BUY
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onSubmit('SELL'); }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '20px',
                  padding: '0 8px',
                  borderRadius: '3px',
                  border: side === 'SELL' ? 'none' : '1px solid rgba(239, 83, 80, 0.6)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  backgroundColor: side === 'SELL'
                    ? 'rgba(239, 83, 80, 0.9)'
                    : 'rgba(239, 83, 80, 0.3)',
                  transition: 'background-color 0.15s',
                }}
              >
                SELL
              </button>
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
            backgroundColor: cfg.axisColor,
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
            {displayPrice}
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
              backgroundColor: cfg.color,
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
