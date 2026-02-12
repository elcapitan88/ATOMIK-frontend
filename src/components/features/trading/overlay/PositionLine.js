import React, { memo, useState } from 'react';

/**
 * HTML overlay position line.
 * Renders a horizontal line at the position's price with:
 *   - Qty badge + P&L
 *   - Close (×), Reverse (⟲), Protect (🛡) buttons on hover
 *
 * Positioned via CSS transform translateY for 60fps performance.
 * Styled to match Atomik dark-glass aesthetic — cyan for long, red for short.
 */

const ActionButton = memo(({ onClick, bgColor, title, children, visible }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    title={title}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '18px',
      height: '18px',
      borderRadius: '4px',
      border: '1px solid rgba(255,255,255,0.15)',
      cursor: 'pointer',
      fontSize: '10px',
      fontWeight: 'bold',
      lineHeight: 1,
      padding: 0,
      transition: 'opacity 0.15s, transform 0.1s',
      color: '#ffffff',
      backgroundColor: bgColor,
      opacity: visible ? 0.9 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.8)',
      pointerEvents: visible ? 'auto' : 'none',
      backdropFilter: 'blur(4px)',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = visible ? '0.9' : '0';
      e.currentTarget.style.transform = visible ? 'scale(1)' : 'scale(0.8)';
    }}
  >
    {children}
  </button>
));

ActionButton.displayName = 'ActionButton';

const PositionLine = memo(({
  data,
  yPosition,
  chartWidth,
  visible,
}) => {
  const [hovered, setHovered] = useState(false);

  if (!visible || yPosition < -50 || yPosition > 5000) return null;

  const {
    isLong, quantity, formattedPrice, color, pnl,
    onClose, onReverse, onProtect,
  } = data;

  const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
  const pnlColor = pnl >= 0 ? '#00E5FF' : '#ef5350';

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        transform: `translateY(${yPosition}px)`,
        pointerEvents: 'auto',
        zIndex: 10,
        willChange: 'transform',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Horizontal line — solid */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: '80px',
          height: '1px',
          top: '0px',
          background: color,
          opacity: 0.6,
        }}
      />

      {/* Hit area — taller invisible area for easy hover */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: '80px',
          height: '11px',
          top: '-5px',
          cursor: 'default',
        }}
      />

      {/* Label + buttons container — anchored near price scale */}
      <div
        style={{
          position: 'absolute',
          right: '84px',
          top: '-10px',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
        }}
      >
        {/* Action buttons — appear on hover */}
        <ActionButton onClick={onClose} bgColor="rgba(239, 83, 80, 0.8)" title="Close position" visible={hovered}>
          ×
        </ActionButton>
        <ActionButton onClick={onReverse} bgColor="rgba(255, 152, 0, 0.8)" title="Reverse position" visible={hovered}>
          ⟲
        </ActionButton>
        <ActionButton onClick={onProtect} bgColor="rgba(156, 39, 176, 0.8)" title="Add TP/SL brackets" visible={hovered}>
          ⛨
        </ActionButton>

        {/* Compact pill: qty + price */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: isLong ? 'rgba(0, 229, 255, 0.12)' : 'rgba(239, 83, 80, 0.12)',
            border: `1px solid ${color}`,
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          {/* Qty */}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: color,
              letterSpacing: '0.3px',
            }}
          >
            {quantity}
          </span>

          <span style={{ opacity: 0.3, color: '#fff', fontSize: '10px' }}>|</span>

          {/* Price */}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'monospace',
              color: '#ffffffcc',
            }}
          >
            {formattedPrice}
          </span>
        </div>

        {/* P&L badge */}
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: pnlColor,
            fontWeight: 600,
            padding: '2px 5px',
            borderRadius: '4px',
            backgroundColor: 'rgba(0,0,0,0.45)',
            border: `1px solid ${pnl >= 0 ? 'rgba(0, 229, 255, 0.2)' : 'rgba(239, 83, 80, 0.2)'}`,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
          }}
        >
          {pnlStr}
        </span>
      </div>
    </div>
  );
});

PositionLine.displayName = 'PositionLine';

export default PositionLine;
