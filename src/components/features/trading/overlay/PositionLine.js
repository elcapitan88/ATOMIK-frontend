import React, { memo, useState } from 'react';
import TradingLineLabel from './TradingLineLabel';

/**
 * HTML overlay position line.
 * Renders a horizontal line at the position's price with:
 *   - Side/qty/symbol label pill
 *   - Close (×), Reverse (⟲), Protect (🛡) buttons
 *
 * Positioned via CSS transform translateY for 60fps performance.
 */

const BUTTON_STYLES = {
  base: {
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
    transition: 'opacity 0.15s, transform 0.1s',
    color: '#ffffff',
  },
};

const ActionButton = memo(({ onClick, bgColor, title, children, visible }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    title={title}
    style={{
      ...BUTTON_STYLES.base,
      backgroundColor: bgColor,
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.8)',
      pointerEvents: visible ? 'auto' : 'none',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.opacity = visible ? '1' : '0'; e.currentTarget.style.transform = visible ? 'scale(1)' : 'scale(0.8)'; }}
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
    side, quantity, symbol, accountNickname,
    formattedPrice, color, bodyColor, pnl,
    onClose, onReverse, onProtect,
  } = data;

  const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
  const pnlColor = pnl >= 0 ? '#4caf50' : '#ef5350';

  const labelText = accountNickname
    ? `${side} ${quantity} ${symbol} [${accountNickname}]`
    : `${side} ${quantity} ${symbol}`;

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
          right: '80px', // leave room for price scale
          height: '1px',
          top: '0px',
          background: color,
          opacity: 0.7,
        }}
      />

      {/* Dashed line extension for visual clarity */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: '80px',
          height: '1px',
          top: '0px',
          backgroundImage: `repeating-linear-gradient(to right, ${color} 0, ${color} 6px, transparent 6px, transparent 10px)`,
          opacity: 0.4,
        }}
      />

      {/* Label + buttons container — positioned right-center */}
      <div
        style={{
          position: 'absolute',
          right: '84px', // to the left of price scale
          top: '-10px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {/* Action buttons */}
        <ActionButton
          onClick={onClose}
          bgColor="#ef5350"
          title="Close position"
          visible={hovered}
        >
          ×
        </ActionButton>
        <ActionButton
          onClick={onReverse}
          bgColor="#ff9800"
          title="Reverse position"
          visible={hovered}
        >
          ⟲
        </ActionButton>
        <ActionButton
          onClick={onProtect}
          bgColor="#9c27b0"
          title="Add TP/SL brackets"
          visible={hovered}
        >
          ⛨
        </ActionButton>

        {/* Label pill */}
        <TradingLineLabel
          text={labelText}
          price={formattedPrice}
          color={color}
          bodyColor={bodyColor}
        />

        {/* P&L badge */}
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: pnlColor,
            fontWeight: 600,
            padding: '1px 4px',
            borderRadius: '3px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
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
