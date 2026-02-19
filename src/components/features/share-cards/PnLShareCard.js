import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';

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
 *   username    - user's display name / handle
 */

const FORMAT_CONFIG = {
  square: {
    width: 1080,
    height: 1080,
    bgImage: '/images/bg-square.png',
    heroFontSize: 72,
    balanceFontSize: 44,
    statFontSize: 28,
    labelFontSize: 16,
    padding: 48,
    statsGap: 16,
    sectionGap: 32,
    logoHeight: 80,
    qrSize: 72,
  },
  landscape: {
    width: 1200,
    height: 675,
    bgImage: '/images/bg-landscape.png',
    heroFontSize: 60,
    balanceFontSize: 36,
    statFontSize: 24,
    labelFontSize: 14,
    padding: 40,
    statsGap: 12,
    sectionGap: 24,
    logoHeight: 64,
    qrSize: 56,
  },
  story: {
    width: 1080,
    height: 1920,
    bgImage: '/images/bg-story.png',
    heroFontSize: 84,
    balanceFontSize: 52,
    statFontSize: 32,
    labelFontSize: 18,
    padding: 56,
    statsGap: 20,
    sectionGap: 48,
    logoHeight: 96,
    qrSize: 88,
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

/** Shared footer: username on left, QR + branding on right */
const CardFooter = ({ username, cfg }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}
  >
    {/* Username */}
    <div
      style={{
        fontSize: cfg.labelFontSize,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 600,
        letterSpacing: 0.5,
      }}
    >
      {username ? `@${username}` : ''}
    </div>

    {/* QR + branding */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
        }}
      >
        <img
          src="/logos/atomik-logo.svg"
          alt="Atomik"
          style={{ height: cfg.logoHeight * 0.55 }}
          crossOrigin="anonymous"
        />
        <span
          style={{
            fontSize: cfg.labelFontSize - 3,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: 1,
            fontWeight: 500,
          }}
        >
          atomiktrading.io
        </span>
      </div>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 6,
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <QRCode
          value="https://atomiktrading.io"
          size={cfg.qrSize}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>
    </div>
  </div>
);

/** Glowing PnL hero number */
const PnLHero = ({ label, value, color, fontSize, labelSize, sectionGap }) => {
  const glowShadow = [
    `0 0 10px ${color}99`,
    `0 0 30px ${color}66`,
    `0 0 60px ${color}33`,
    `0 0 100px ${color}1A`,
  ].join(', ');

  return (
    <div style={{ textAlign: 'center', marginBottom: sectionGap * 0.8 }}>
      <div
        style={{
          fontSize: labelSize,
          textTransform: 'uppercase',
          letterSpacing: 2.5,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: 12,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: fontSize,
          fontWeight: 800,
          color: color,
          lineHeight: 1.1,
          textShadow: glowShadow,
        }}
      >
        {value}
      </div>
    </div>
  );
};

/** Prominent total balance section */
const TotalBalanceSection = ({ balance, accountCount, privacyMode, cfg }) => {
  const balanceValue = privacyMode
    ? '$***'
    : `$${formatCurrency(balance)}`;

  return (
    <div style={{ textAlign: 'center', marginBottom: cfg.sectionGap }}>
      <div
        style={{
          fontSize: cfg.labelFontSize - 1,
          textTransform: 'uppercase',
          letterSpacing: 2,
          color: 'rgba(255,255,255,0.4)',
          marginBottom: 10,
          fontWeight: 500,
        }}
      >
        Total Balance &middot; {accountCount} {accountCount === 1 ? 'Account' : 'Accounts'}
      </div>
      <div
        style={{
          fontSize: cfg.balanceFontSize,
          fontWeight: 700,
          color: '#FFFFFF',
          lineHeight: 1.2,
        }}
      >
        {balanceValue}
      </div>
    </div>
  );
};

const PnLShareCard = forwardRef(({ data, format = 'square', privacyMode = false, transparentBg = false, username = '' }, ref) => {
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
    const glowShadow = [
      `0 0 10px ${pnlColor}99`,
      `0 0 30px ${pnlColor}66`,
      `0 0 60px ${pnlColor}33`,
      `0 0 100px ${pnlColor}1A`,
    ].join(', ');

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
          {/* Header — centered logo + period badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: cfg.sectionGap,
              gap: 10,
            }}
          >
            <img
              src="/logos/atomik-logo.svg"
              alt="Atomik"
              style={{ height: cfg.logoHeight }}
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
            {/* Left side: Hero PnL + Total Balance */}
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
                  marginBottom: 28,
                  textShadow: glowShadow,
                }}
              >
                {heroValue}
              </div>
              {/* Total Balance */}
              <div
                style={{
                  fontSize: cfg.labelFontSize - 1,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Total Balance &middot; {data.account_count} {data.account_count === 1 ? 'Account' : 'Accounts'}
              </div>
              <div
                style={{
                  fontSize: cfg.balanceFontSize,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                }}
              >
                {privacyMode ? '$***' : `$${formatCurrency(data.total_balance || 0)}`}
              </div>
            </div>

            {/* Right side: Stats 2x2 */}
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
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 16 }}>
            <CardFooter username={username} cfg={cfg} />
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
        {/* Header — centered logo + period badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: cfg.sectionGap,
            gap: 12,
          }}
        >
          <img
            src="/logos/atomik-logo.svg"
            alt="Atomik"
            style={{ height: cfg.logoHeight }}
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

        {/* Hero PnL with glow */}
        <PnLHero
          label={`${data.period_label} P&L`}
          value={heroValue}
          color={pnlColor}
          fontSize={cfg.heroFontSize}
          labelSize={cfg.labelFontSize}
          sectionGap={cfg.sectionGap}
        />

        {/* Total Balance — prominent standalone section */}
        <TotalBalanceSection
          balance={data.total_balance || 0}
          accountCount={data.account_count}
          privacyMode={privacyMode}
          cfg={cfg}
        />

        {/* Stats Grid 2x2 */}
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
          </div>
        </div>

        {/* Spacer for story format */}
        {format === 'story' && <div style={{ flex: '0.3' }} />}

        {/* Flex spacer pushes footer to bottom */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <CardFooter username={username} cfg={cfg} />
      </div>
    </div>
  );
});

PnLShareCard.displayName = 'PnLShareCard';
export default PnLShareCard;
