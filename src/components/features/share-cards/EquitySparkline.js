import React from 'react';

/**
 * SVG sparkline for equity curve in share cards.
 * Uses inline SVG for reliable html2canvas capture.
 *
 * Props:
 *   data        - array of { date, cumulative_pnl }
 *   width       - SVG width in px
 *   height      - SVG height in px
 *   isPositive  - whether overall PnL is positive (determines color)
 *   strokeWidth - line thickness (default: 2.5)
 */
const EquitySparkline = ({ data = [], width = 300, height = 80, isPositive = true, strokeWidth = 2.5 }) => {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        <line
          x1={0} y1={height / 2} x2={width} y2={height / 2}
          stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 4"
        />
        <text
          x={width / 2} y={height / 2 + 16}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize="12"
          fontFamily="Inter, Segoe UI, system-ui, sans-serif"
        >
          Not enough data
        </text>
      </svg>
    );
  }

  const values = data.map(d => d.cumulative_pnl);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const padding = { top: 6, bottom: 6, left: 0, right: 0 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = values.map((val, i) => {
    const x = padding.left + (i / (values.length - 1)) * chartW;
    const y = padding.top + chartH - ((val - minVal) / range) * chartH;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const fillPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

  const lineColor = isPositive ? '#48BB78' : '#F56565';
  const gradientId = `sparkGrad-${isPositive ? 'pos' : 'neg'}-${width}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Zero line if data crosses zero */}
      {minVal < 0 && maxVal > 0 && (
        <line
          x1={padding.left}
          y1={padding.top + chartH - ((0 - minVal) / range) * chartH}
          x2={width - padding.right}
          y2={padding.top + chartH - ((0 - minVal) / range) * chartH}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={0.5}
          strokeDasharray="3 3"
        />
      )}

      {/* Gradient fill */}
      <path d={fillPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={4}
        fill={lineColor}
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={7}
        fill={lineColor}
        opacity={0.25}
      />
    </svg>
  );
};

export default EquitySparkline;
