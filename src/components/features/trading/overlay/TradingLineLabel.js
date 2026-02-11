import React, { memo } from 'react';

/**
 * Shared pill-shaped label for position and order lines.
 * Rendered as pure HTML/CSS for performance (no Chakra overhead per frame).
 *
 * Props:
 *   text       – main label text (e.g. "LONG 2 NQ [DEMO]")
 *   price      – formatted price string
 *   color      – line/body color
 *   bodyColor  – background color (can include alpha)
 *   textColor  – text color (defaults to white)
 *   compact    – if true, show minimal info
 */
const TradingLineLabel = memo(({
  text,
  price,
  color,
  bodyColor,
  textColor = '#ffffff',
  compact = false,
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: bodyColor || color,
        border: `1px solid ${color}`,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: textColor,
        lineHeight: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      <span>{text}</span>
      {price && !compact && (
        <>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{price}</span>
        </>
      )}
    </div>
  );
});

TradingLineLabel.displayName = 'TradingLineLabel';

export default TradingLineLabel;
