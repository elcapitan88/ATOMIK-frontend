import React, { forwardRef } from 'react';
import EquitySparkline from './EquitySparkline';

/**
 * PnL Share Card — pixel-exact card component for image capture.
 *
 * IMPORTANT: Uses raw <div> + inline styles (NOT Chakra UI).
 * html2canvas cannot reliably resolve Emotion CSS-in-JS classes.
 *
 * Props:
 *   data        - ShareCardDataResponse from backend
 *   format      - 'square' | 'landscape' | 'story'
 *   privacyMode - hide dollar amounts
 */

const FORMAT_CONFIG = {
  square: {
    width: 1080,
    height: 1080,
    bgImage: '/images/bg-square.png',
    heroFontSize: 72,
    statFontSize: 28,
    labelFontSize: 16,
    sparklineW: 920,
    sparklineH: 140,
    padding: 48,
    statsGap: 16,
    sectionGap: 32,
  },
  landscape: {
    width: 1200,
    height: 675,
    bgImage: '/images/bg-landscape.png',
    heroFontSize: 60,
    statFontSize: 24,
    labelFontSize: 14,
    sparklineW: 520,
    sparklineH: 160,
    padding: 40,
    statsGap: 12,
    sectionGap: 24,
  },
  story: {
    width: 1080,
    height: 1920,
    bgImage: '/images/bg-story.png',
    heroFontSize: 84,
    statFontSize: 32,
    labelFontSize: 18,
    sparklineW: 920,
    sparklineH: 200,
    padding: 56,
    statsGap: 20,
    sectionGap: 48,
  },
};

const formatCurrency = (value) => {
  return Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const StatBlock = ({ label, value, color = '#FFFFFF', fontSize, labelSize }) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.06)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      padding: '16px 12px',
      textAlign: 'center',
      flex: '1 1 0',
      minWidth: 0,
    }}
  >
    <div
      style={{
        fontSize: labelSize || fontSize * 0.5,
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: 500,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
  </div>
);

const PnLShareCard = forwardRef(({ data, format = 'square', privacyMode = false, transparentBg = false }, ref) => {
  const cfg = FORMAT_CONFIG[format];
  if (!data || !cfg) return null;

  const isPositive = data.total_pnl >= 0;
  const pnlColor = isPositive ? '#48BB78' : '#F56565';
  const pnlSign = isPositive ? '+' : '-';

  const streakLabel =
    data.current_streak > 0
      ? `W${data.current_streak}`
      : data.current_streak < 0
        ? `L${Math.abs(data.current_streak)}`
        : '-';
  const streakColor =
    data.current_streak > 0 ? '#48BB78' : data.current_streak < 0 ? '#F56565' : '#A0AEC0';

  const heroValue = privacyMode
    ? `${pnlSign}$***`
    : `${pnlSign}$${formatCurrency(data.total_pnl)}`;

  const bestTradeValue = data.best_trade
    ? privacyMode
      ? `${data.best_trade.symbol} $***`
      : `${data.best_trade.symbol} ${data.best_trade.pnl >= 0 ? '+' : '-'}$${formatCurrency(data.best_trade.pnl)}`
    : '-';
  const bestTradeColor = data.best_trade
    ? data.best_trade.pnl >= 0
      ? '#48BB78'
      : '#F56565'
    : '#A0AEC0';

  const containerStyle = {
    width: cfg.width,
    height: cfg.height,
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    color: '#FFFFFF',
    ...(transparentBg
      ? { backgroundColor: 'transparent' }
      : {
          backgroundImage: `url(${cfg.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }),
  };

  const overlayBg = transparentBg ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.4)';

  // Landscape uses side-by-side layout
  if (format === 'landscape') {
    return (
      <div ref={ref} style={containerStyle}>
        {/* Dark overlay for text readability */}
        <div style={{ position: 'absolute', inset: 0, background: overlayBg }} />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: cfg.padding,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: cfg.sectionGap,
            }}
          >
            <img
              src="/logos/atomik-logo.svg"
              alt="Atomik"
              style={{ height: 32 }}
              crossOrigin="anonymous"
            />
            <div
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: '5px 14px',
                fontSize: cfg.labelFontSize,
                fontWeight: 500,
              }}
            >
              {data.period_label} Recap &middot; {data.period_end}
            </div>
          </div>

          {/* Main content: left + right */}
          <div style={{ display: 'flex', flex: 1, gap: 32 }}>
            {/* Left side: Hero PnL + Sparkline */}
            <div
              style={{
                flex: '1 1 50%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: cfg.labelFontSize,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 8,
                }}
              >
                {data.period_label} P&L
              </div>
              <div
                style={{
                  fontSize: cfg.heroFontSize,
                  fontWeight: 800,
                  color: pnlColor,
                  lineHeight: 1.1,
                  marginBottom: 24,
                }}
              >
                {heroValue}
              </div>
              <div
                style={{
                  fontSize: cfg.labelFontSize - 2,
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Equity Curve
              </div>
              <EquitySparkline
                data={data.equity_curve}
                width={cfg.sparklineW}
                height={cfg.sparklineH}
                isPositive={isPositive}
                strokeWidth={2.5}
              />
            </div>

            {/* Right side: Stats */}
            <div
              style={{
                flex: '1 1 45%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: cfg.statsGap,
              }}
            >
              <div style={{ display: 'flex', gap: cfg.statsGap }}>
                <StatBlock
                  label="Win Rate"
                  value={`${data.win_rate.toFixed(0)}%`}
                  color="#00C6E0"
                  fontSize={cfg.statFontSize}
                  labelSize={cfg.labelFontSize - 2}
                />
                <StatBlock
                  label="Trades"
                  value={data.total_trades}
                  fontSize={cfg.statFontSize}
                  labelSize={cfg.labelFontSize - 2}
                />
              </div>
              <div style={{ display: 'flex', gap: cfg.statsGap }}>
                <StatBlock
                  label="Profit Factor"
                  value={data.profit_factor > 99 ? '99+' : data.profit_factor.toFixed(1)}
                  color="#00C6E0"
                  fontSize={cfg.statFontSize}
                  labelSize={cfg.labelFontSize - 2}
                />
                <StatBlock
                  label="Streak"
                  value={streakLabel}
                  color={streakColor}
                  fontSize={cfg.statFontSize}
                  labelSize={cfg.labelFontSize - 2}
                />
              </div>
              <div style={{ display: 'flex', gap: cfg.statsGap }}>
                <StatBlock
                  label="Best Trade"
                  value={bestTradeValue}
                  color={bestTradeColor}
                  fontSize={cfg.statFontSize - 4}
                  labelSize={cfg.labelFontSize - 2}
                />
                <StatBlock
                  label="Accounts"
                  value={data.account_count}
                  fontSize={cfg.statFontSize}
                  labelSize={cfg.labelFontSize - 2}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              marginTop: 16,
            }}
          >
            <span
              style={{
                fontSize: cfg.labelFontSize - 2,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: 1.5,
                fontWeight: 500,
              }}
            >
              atomiktrading.io
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Square and Story layouts (vertical stacking)
  return (
    <div ref={ref} style={containerStyle}>
      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: overlayBg }} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: cfg.padding,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: cfg.sectionGap,
          }}
        >
          <img
            src="/logos/atomik-logo.svg"
            alt="Atomik"
            style={{ height: format === 'story' ? 44 : 36 }}
            crossOrigin="anonymous"
          />
          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '6px 16px',
              fontSize: cfg.labelFontSize,
              fontWeight: 500,
            }}
          >
            {data.period_label} Recap &middot; {data.period_end}
          </div>
        </div>

        {/* Spacer for story format */}
        {format === 'story' && <div style={{ flex: '0.3' }} />}

        {/* Hero PnL */}
        <div style={{ textAlign: 'center', marginBottom: cfg.sectionGap * 1.2 }}>
          <div
            style={{
              fontSize: cfg.labelFontSize,
              textTransform: 'uppercase',
              letterSpacing: 2.5,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            {data.period_label} P&L
          </div>
          <div
            style={{
              fontSize: cfg.heroFontSize,
              fontWeight: 800,
              color: pnlColor,
              lineHeight: 1.1,
            }}
          >
            {heroValue}
          </div>
        </div>

        {/* Stats Grid 2x3 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: cfg.statsGap,
            marginBottom: cfg.sectionGap,
          }}
        >
          <div style={{ display: 'flex', gap: cfg.statsGap }}>
            <StatBlock
              label="Win Rate"
              value={`${data.win_rate.toFixed(0)}%`}
              color="#00C6E0"
              fontSize={cfg.statFontSize}
              labelSize={cfg.labelFontSize - 2}
            />
            <StatBlock
              label="Trades"
              value={data.total_trades}
              fontSize={cfg.statFontSize}
              labelSize={cfg.labelFontSize - 2}
            />
            <StatBlock
              label="Profit Factor"
              value={data.profit_factor > 99 ? '99+' : data.profit_factor.toFixed(1)}
              color="#00C6E0"
              fontSize={cfg.statFontSize}
              labelSize={cfg.labelFontSize - 2}
            />
          </div>
          <div style={{ display: 'flex', gap: cfg.statsGap }}>
            <StatBlock
              label="Best Trade"
              value={bestTradeValue}
              color={bestTradeColor}
              fontSize={cfg.statFontSize - 4}
              labelSize={cfg.labelFontSize - 2}
            />
            <StatBlock
              label="Streak"
              value={streakLabel}
              color={streakColor}
              fontSize={cfg.statFontSize}
              labelSize={cfg.labelFontSize - 2}
            />
            <StatBlock
              label="Accounts"
              value={data.account_count}
              fontSize={cfg.statFontSize}
              labelSize={cfg.labelFontSize - 2}
            />
          </div>
        </div>

        {/* Spacer for story format */}
        {format === 'story' && <div style={{ flex: '0.2' }} />}

        {/* Equity Curve */}
        <div style={{ marginBottom: cfg.sectionGap }}>
          <div
            style={{
              fontSize: cfg.labelFontSize - 2,
              color: 'rgba(255,255,255,0.35)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              fontWeight: 500,
            }}
          >
            Equity Curve
          </div>
          <EquitySparkline
            data={data.equity_curve}
            width={cfg.sparklineW}
            height={cfg.sparklineH}
            isPositive={isPositive}
            strokeWidth={3}
          />
        </div>

        {/* Flex spacer pushes footer to bottom */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span
            style={{
              fontSize: cfg.labelFontSize,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: 2,
              fontWeight: 500,
            }}
          >
            atomiktrading.io
          </span>
        </div>
      </div>
    </div>
  );
});

PnLShareCard.displayName = 'PnLShareCard';
export default PnLShareCard;
