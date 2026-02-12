import React, { memo, useState } from 'react';

/**
 * HTML overlay position line.
 * Renders a horizontal line at the position's price with:
 *   - Qty badge + P&L
 *   - Close, Reverse, Protect buttons on hover
 *   - Price tag on the Y-axis
 *
 * Colors: green for LONG, red for SHORT.
 * P&L: green if positive, red if negative.
 */

// Position line + axis tag colors
const LINE_COLORS = {
  long: '#26a69a',       // green — line + qty pill
  short: '#ef5350',      // red   — line + qty pill
  longTag: '#1B5E20',    // dark green — axis tag background
  shortTag: '#B71C1C',   // dark red   — axis tag background
};

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

const NUDGE_THRESHOLD = 22; // px – if within this distance, nudge away

const PositionLine = memo(({
  data,
  yPosition,
  chartWidth,
  visible,
  currentPriceY,
}) => {
  const [hovered, setHovered] = useState(false);

  if (!visible || yPosition < -50 || yPosition > 5000) return null;

  const {
    isLong, quantity, formattedPrice, pnl,
    onClose, onReverse, onProtect,
  } = data;

  const lineColor = isLong ? LINE_COLORS.long : LINE_COLORS.short;
  const axisTagColor = isLong ? LINE_COLORS.longTag : LINE_COLORS.shortTag;

  const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
  const pnlColor = pnl >= 0 ? '#4caf50' : '#ef5350'; // green / red

  // ── Smart nudge: shift axis tag away from TV's current price tag ──
  let axisTagOffset = -9; // default centered on line
  if (currentPriceY != null) {
    const distance = yPosition - currentPriceY; // positive = position is below current price
    const absDist = Math.abs(distance);
    if (absDist < NUDGE_THRESHOLD) {
      // Push away from current price tag: up if position is above, down if below
      if (distance <= 0) {
        // Position line is above current price → nudge further up
        axisTagOffset = -9 - (NUDGE_THRESHOLD - absDist);
      } else {
        // Position line is below current price → nudge further down
        axisTagOffset = -9 + (NUDGE_THRESHOLD - absDist);
      }
    }
  }

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
      {/* Horizontal line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: '80px',
          height: '1px',
          top: '0px',
          background: lineColor,
          opacity: 0.7,
        }}
      />

      {/* Hit area — taller invisible zone for easy hover */}
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

      {/* Label + buttons container */}
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

        {/* Qty pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: isLong ? 'rgba(38, 166, 154, 0.15)' : 'rgba(239, 83, 80, 0.15)',
            border: `1px solid ${lineColor}`,
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: '#ffffff',
              letterSpacing: '0.3px',
            }}
          >
            {quantity}
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
            border: `1px solid ${pnl >= 0 ? 'rgba(76, 175, 80, 0.25)' : 'rgba(239, 83, 80, 0.25)'}`,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
          }}
        >
          {pnlStr}
        </span>
      </div>

      {/* Price tag on the Y-axis */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: `${axisTagOffset}px`,
          width: '78px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: axisTagColor,
          borderRadius: '2px',
          zIndex: 11,
          pointerEvents: 'none',
          transition: 'top 0.15s ease-out',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'monospace',
            color: '#ffffff',
            letterSpacing: '0.2px',
          }}
        >
          {formattedPrice}
        </span>
      </div>
    </div>
  );
});

PositionLine.displayName = 'PositionLine';

export default PositionLine;
