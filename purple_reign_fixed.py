"""
Purple Reign Strategy - Engine Implementation
Converted from Pine Script to Python for real-time execution
Supports NQ, MNQ, ES, MES futures trading
"""

import math
from collections import deque
from datetime import datetime, time, timedelta, timezone
from typing import Dict, List, Optional, Tuple
import pytz

from strategies.base_strategy import BaseStrategy
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))
from models import TickData, Signal, SignalAction


class PurpleReignStrategy(BaseStrategy):
    """
    Purple Reign momentum strategy using TTM Squeeze, MACD, and Parabolic SAR.

    Features:
    - TTM Squeeze detection (Bollinger Bands & Keltner Channels)
    - MACD or TTM momentum signals for entry
    - Parabolic SAR for trailing stops
    - 5-minute bar aggregation
    - Real-time tick execution
    - Anti-repaint protection
    """

    def __init__(self):
        # Support all micro and mini contracts
        symbols = ["NQ", "MNQ", "ES", "MES"]
        super().__init__("Purple Reign", symbols)

        # Strategy parameters (matching Pine Script)
        self.signal_source = "MACD"  # "MACD" or "TTM"
        self.stop_loss_length = 18    # Bars for lowest low calculation

        # PSAR parameters
        self.psar_start = 0.02
        self.psar_increment = 0.02
        self.psar_maximum = 0.2

        # MACD parameters
        self.macd_fast = 8
        self.macd_slow = 17
        self.macd_signal = 9

        # Bollinger Bands parameters
        self.bb_length = 18
        self.bb_mult = 2.0

        # Keltner Channels parameters
        self.kc_length = 18
        self.kc_mult = 1.5
        self.kc_mom_length = 18

        # Trading session (NYSE hours in ET)
        self.session_start = time(9, 30)  # 9:30 AM ET
        self.session_end = time(15, 59)   # 3:59 PM ET (close positions 1 min before close)
        self.market_close = time(16, 0)   # 4:00 PM ET
        self.timezone = pytz.timezone('US/Eastern')

        # Bar aggregation (5-minute bars)
        self.bar_interval = 5  # minutes
        self.bars: Dict[str, deque] = {}  # Historical bars per symbol
        self.current_bar: Dict[str, dict] = {}  # Current forming bar
        self.last_bar_time: Dict[str, datetime] = {}  # Track bar completion

        # Position and risk management
        self.positions: Dict[str, int] = {}
        self.entry_prices: Dict[str, float] = {}
        self.stop_losses: Dict[str, float] = {}
        self.using_psar: Dict[str, bool] = {}

        # PSAR state tracking
        self.psar_value: Dict[str, Optional[float]] = {}
        self.psar_trend: Dict[str, int] = {}  # 1=uptrend, -1=downtrend
        self.psar_ep: Dict[str, float] = {}   # Extreme point
        self.psar_af: Dict[str, float] = {}   # Acceleration factor
        self.prev_psar_below: Dict[str, bool] = {}  # For crossover detection

        # Indicator caching
        self.cached_indicators: Dict[str, dict] = {}
        self.indicators_calculated: Dict[str, bool] = {}

        # Anti-repaint protection
        self.last_signal_bar: Dict[str, datetime] = {}

    def initialize(self) -> None:
        """Initialize strategy state for all symbols."""
        for symbol in self.symbols:
            # Initialize data structures
            self.bars[symbol] = deque(maxlen=100)  # Keep 100 bars of history
            self.current_bar[symbol] = {}
            # Use timezone-aware datetime.min to match historical data timestamps
            self.last_bar_time[symbol] = datetime.min.replace(tzinfo=timezone.utc)

            # Initialize position tracking
            self.positions[symbol] = 0
            self.entry_prices[symbol] = 0.0
            self.stop_losses[symbol] = 0.0
            self.using_psar[symbol] = False

            # Initialize PSAR state
            self.psar_value[symbol] = None
            self.psar_trend[symbol] = 0
            self.psar_ep[symbol] = 0.0
            self.psar_af[symbol] = self.psar_start
            self.prev_psar_below[symbol] = False

            # Initialize indicators
            self.cached_indicators[symbol] = {}
            self.indicators_calculated[symbol] = False

            # Anti-repaint
            # Use timezone-aware datetime.min to match historical data timestamps
            self.last_signal_bar[symbol] = datetime.min.replace(tzinfo=timezone.utc)

        print(f"[PurpleReign] Strategy initialized for symbols: {self.symbols}")
        print(f"[PurpleReign] Signal source: {self.signal_source}, Stop length: {self.stop_loss_length}")
        print(f"[PurpleReign] PSAR params: {self.psar_start}/{self.psar_increment}/{self.psar_maximum}")
        print(f"[PurpleReign] Trading session: {self.session_start} - {self.session_end} ET")
        print(f"[PurpleReign] Requesting historical data for warmup...")

    def initialize_with_history(self, symbol: str, historical_bars: list) -> None:
        """Initialize strategy with historical 5-minute bar data."""
        print(f"[PurpleReign] *** HISTORICAL DATA RECEIVED: {len(historical_bars)} bars for {symbol} ***")

        if not historical_bars:
            print(f"[PurpleReign] WARNING: No historical bars received for {symbol}")
            return

        # Process historical bars into our 5-minute bar structure
        valid_bars = 0
        for i, bar in enumerate(historical_bars):
            try:
                if bar is None:
                    continue

                # Convert bar to our format
                bar_time = bar.get('time')
                # Convert string timestamp to datetime if needed
                if isinstance(bar_time, str):
                    bar_time = datetime.fromisoformat(bar_time.replace('Z', '+00:00'))

                ohlc_bar = {
                    'time': bar_time,
                    'open': bar.get('open'),
                    'high': bar.get('high'),
                    'low': bar.get('low'),
                    'close': bar.get('close'),
                    'volume': bar.get('volume', 0)
                }

                # Validate required fields
                if all(ohlc_bar[field] is not None for field in ['open', 'high', 'low', 'close']):
                    self.bars[symbol].append(ohlc_bar)
                    valid_bars += 1

                    # Update last bar time to prevent duplicate bar creation
                    if ohlc_bar.get('time'):
                        # Convert string timestamp to datetime if needed
                        bar_time = ohlc_bar['time']
                        if isinstance(bar_time, str):
                            # Parse ISO format timestamp (e.g., "2024-10-20T15:30:00")
                            bar_time = datetime.fromisoformat(bar_time.replace('Z', '+00:00'))
                        self.last_bar_time[symbol] = bar_time

            except Exception as e:
                if i < 3:  # Show error for first few bars only
                    print(f"[PurpleReign] ERROR: Failed to process bar {i}: {e}")

        print(f"[PurpleReign] Successfully loaded {valid_bars}/{len(historical_bars)} historical bars for {symbol}")

        # Initialize current bar with last historical bar
        if self.bars[symbol]:
            last_bar = self.bars[symbol][-1]
            self.current_bar[symbol] = {
                'open': last_bar['close'],
                'high': last_bar['close'],
                'low': last_bar['close'],
                'close': last_bar['close'],
                'volume': 0,
                'time': self.last_bar_time[symbol]
            }

            # Calculate initial indicators
            self.calculate_indicators(symbol)

            # Initialize PSAR with historical data
            if len(self.bars[symbol]) >= 2:
                self.calculate_psar(symbol, list(self.bars[symbol]))

            print(f"[PurpleReign.{symbol}] Indicators initialized, ready to trade!")
            indicators = self.cached_indicators.get(symbol, {})
            if indicators:
                print(f"[PurpleReign.{symbol}] TTM Squeeze: {indicators.get('ttm_squeeze', False)}")
                print(f"[PurpleReign.{symbol}] MACD Hist: {indicators.get('macd_hist', 0):.4f}")
                print(f"[PurpleReign.{symbol}] TTM Mom: {indicators.get('ttm_momentum', 0):.4f}")
                print(f"[PurpleReign.{symbol}] Lowest Low: {indicators.get('lowest_low', 0):.2f}")

    def on_tick(self, tick: TickData) -> Optional[Signal]:
        """
        Process tick data and generate trading signals.

        Real-time execution without waiting for bar completion.
        Anti-repaint protection ensures one signal per 5-min bar max.
        """
        symbol = tick.symbol

        # Ensure tick timestamp is timezone-aware to prevent comparison errors
        if tick.timestamp.tzinfo is None:
            # Make timezone-aware if it's naive
            tick.timestamp = tick.timestamp.replace(tzinfo=timezone.utc)

        # Only process our symbols
        if symbol not in self.symbols:
            return None

        # Log every 100th tick to show we're receiving data
        if not hasattr(self, 'tick_count'):
            self.tick_count = {}
        self.tick_count[symbol] = self.tick_count.get(symbol, 0) + 1

        if self.tick_count[symbol] % 100 == 0:
            print(f"[PurpleReign.{symbol}] Processing tick #{self.tick_count[symbol]}: ${tick.price:.2f}")
            # Also log current bar status
            if symbol in self.bars:
                print(f"[PurpleReign.{symbol}] Bars collected: {len(self.bars[symbol])}, Indicators calculated: {self.indicators_calculated.get(symbol, False)}")

        # Update bar data
        self.update_bar(symbol, tick)

        # Check if we're in trading session
        if not self.is_trading_session(tick.timestamp):
            # Force close positions at end of day
            if self.should_force_close(tick.timestamp) and self.positions.get(symbol, 0) != 0:
                print(f"[PurpleReign.{symbol}] End of day force close at {tick.price}")
                return self.generate_exit_signal(symbol, tick.price, "EOD Exit")
            return None

        # Calculate indicators on current data (including partial bar)
        self.calculate_indicators(symbol)

        # Log indicator status occasionally
        if self.tick_count[symbol] % 500 == 0 and self.indicators_calculated.get(symbol):
            indicators = self.cached_indicators.get(symbol, {})
            if indicators:
                print(f"[PurpleReign.{symbol}] TTM Squeeze: {indicators.get('ttm_squeeze', 'N/A')}, MACD Hist: {indicators.get('macd_hist', 0):.4f}, Bars: {len(self.bars[symbol])}")

        # Check for exit conditions first (if in position)
        if self.positions.get(symbol, 0) != 0:
            exit_signal = self.check_exit_conditions(symbol, tick)
            if exit_signal:
                return exit_signal

        # Check for entry conditions
        entry_signal = self.check_entry_conditions(symbol, tick)
        if entry_signal:
            return entry_signal

        return None

    def update_bar(self, symbol: str, tick: TickData) -> None:
        """Update 5-minute bar aggregation with new tick."""
        current_time = tick.timestamp
        bar_time = self.get_bar_time(current_time)

        # Check if we need to start a new bar
        # Use timezone-aware datetime for comparison
        min_time = datetime.min.replace(tzinfo=timezone.utc)
        if bar_time > self.last_bar_time.get(symbol, min_time):
            # Complete the previous bar if it exists
            if self.current_bar.get(symbol):
                completed_bar = self.current_bar[symbol].copy()
                completed_bar['time'] = self.last_bar_time[symbol]
                self.bars[symbol].append(completed_bar)
                self.indicators_calculated[symbol] = False  # Force recalculation

            # Start new bar
            self.current_bar[symbol] = {
                'open': tick.price,
                'high': tick.price,
                'low': tick.price,
                'close': tick.price,
                'volume': tick.volume if tick.volume else 0,
                'time': bar_time
            }
            self.last_bar_time[symbol] = bar_time
        else:
            # Update current bar
            bar = self.current_bar[symbol]
            bar['high'] = max(bar['high'], tick.price)
            bar['low'] = min(bar['low'], tick.price)
            bar['close'] = tick.price
            bar['volume'] = bar.get('volume', 0) + (tick.volume if tick.volume else 0)

    def get_bar_time(self, timestamp: datetime) -> datetime:
        """Round timestamp down to nearest 5-minute interval, preserving timezone."""
        minutes = (timestamp.minute // self.bar_interval) * self.bar_interval
        # Preserve timezone info if present
        return timestamp.replace(minute=minutes, second=0, microsecond=0)

    def is_trading_session(self, timestamp: datetime) -> bool:
        """Check if current time is within trading session."""
        # Convert to ET
        if timestamp.tzinfo is None:
            timestamp = pytz.utc.localize(timestamp)
        et_time = timestamp.astimezone(self.timezone)

        # Check if it's a weekday
        if et_time.weekday() > 4:  # Saturday = 5, Sunday = 6
            return False

        # Check time
        current_time = et_time.time()
        return self.session_start <= current_time < self.session_end

    def should_force_close(self, timestamp: datetime) -> bool:
        """Check if we should force close positions (end of day)."""
        if timestamp.tzinfo is None:
            timestamp = pytz.utc.localize(timestamp)
        et_time = timestamp.astimezone(self.timezone)

        current_time = et_time.time()
        return self.session_end <= current_time < self.market_close

    def calculate_indicators(self, symbol: str) -> None:
        """
        Calculate all indicators including on partial current bar.
        This enables real-time signal generation.
        """
        bars = list(self.bars[symbol])

        # Add current bar for calculation
        if self.current_bar.get(symbol):
            bars.append(self.current_bar[symbol])

        if len(bars) < max(self.bb_length, self.kc_length, self.macd_slow):
            return  # Not enough data

        # Calculate indicators
        indicators = {}

        # Bollinger Bands
        bb_mean, bb_upper, bb_lower = self.calculate_bollinger_bands(bars)
        indicators['bb_upper'] = bb_upper
        indicators['bb_lower'] = bb_lower
        indicators['bb_mean'] = bb_mean

        # Keltner Channels
        kc_mean, kc_upper, kc_lower = self.calculate_keltner_channels(bars)
        indicators['kc_upper'] = kc_upper
        indicators['kc_lower'] = kc_lower
        indicators['kc_mean'] = kc_mean

        # TTM Squeeze detection
        indicators['ttm_squeeze'] = (bb_upper < kc_upper) and (bb_lower > kc_lower)

        # TTM Momentum
        ttm_momentum = self.calculate_ttm_momentum(bars)
        indicators['ttm_momentum'] = ttm_momentum
        indicators['ttm_momentum_1'] = self.cached_indicators.get(symbol, {}).get('ttm_momentum', 0)
        indicators['ttm_momentum_2'] = self.cached_indicators.get(symbol, {}).get('ttm_momentum_1', 0)

        # MACD
        macd_hist = self.calculate_macd_histogram(bars)
        indicators['macd_hist'] = macd_hist
        indicators['macd_hist_1'] = self.cached_indicators.get(symbol, {}).get('macd_hist', 0)
        indicators['macd_hist_2'] = self.cached_indicators.get(symbol, {}).get('macd_hist_1', 0)

        # Lowest low for stop loss
        indicators['lowest_low'] = self.calculate_lowest_low(bars)

        # PSAR
        if len(self.bars[symbol]) >= 2:  # Need completed bars for PSAR
            psar = self.calculate_psar(symbol, list(self.bars[symbol]))
            indicators['psar'] = psar

        self.cached_indicators[symbol] = indicators
        self.indicators_calculated[symbol] = True

    def calculate_bollinger_bands(self, bars: List[dict]) -> Tuple[float, float, float]:
        """Calculate Bollinger Bands."""
        closes = [bar['close'] for bar in bars[-self.bb_length:]]
        mean = sum(closes) / len(closes)

        # Standard deviation
        variance = sum((x - mean) ** 2 for x in closes) / len(closes)
        std_dev = math.sqrt(variance)

        upper = mean + (self.bb_mult * std_dev)
        lower = mean - (self.bb_mult * std_dev)

        return mean, upper, lower

    def calculate_keltner_channels(self, bars: List[dict]) -> Tuple[float, float, float]:
        """Calculate Keltner Channels using ATR."""
        # Calculate mean
        closes = [bar['close'] for bar in bars[-self.kc_length:]]
        mean = sum(closes) / len(closes)

        # Calculate ATR
        atr = self.calculate_atr(bars[-self.kc_length:])
        if atr is None:
            return mean, mean, mean

        upper = mean + (self.kc_mult * atr)
        lower = mean - (self.kc_mult * atr)

        return mean, upper, lower

    def calculate_atr(self, bars: List[dict]) -> Optional[float]:
        """Calculate Average True Range."""
        if len(bars) < 2:
            return None

        true_ranges = []
        for i in range(1, len(bars)):
            high = bars[i]['high']
            low = bars[i]['low']
            prev_close = bars[i-1]['close']

            tr = max(
                high - low,
                abs(high - prev_close),
                abs(low - prev_close)
            )
            true_ranges.append(tr)

        return sum(true_ranges) / len(true_ranges) if true_ranges else None

    def calculate_ttm_momentum(self, bars: List[dict]) -> float:
        """
        Calculate TTM Squeeze momentum using linear regression.
        Matches Pine Script: ta.linreg(src - avg(avg(highest,lowest),sma), length, 0)
        """
        if len(bars) < self.kc_mom_length:
            return 0.0

        momentum_values = []
        for i in range(len(bars) - self.kc_mom_length, len(bars)):
            # Get window of bars
            window = bars[max(0, i-self.kc_mom_length+1):i+1]
            if len(window) < self.kc_mom_length:
                continue

            # Calculate highest and lowest
            highest = max(bar['high'] for bar in window)
            lowest = min(bar['low'] for bar in window)

            # Calculate SMA
            sma = sum(bar['close'] for bar in window) / len(window)

            # Calculate momentum value
            mid_point = (highest + lowest) / 2
            avg = (mid_point + sma) / 2
            momentum_values.append(bars[i]['close'] - avg)

        if len(momentum_values) < 2:
            return 0.0

        # Linear regression on momentum values
        n = len(momentum_values)
        x_values = list(range(n))

        # Calculate slope (simplified linear regression)
        x_mean = sum(x_values) / n
        y_mean = sum(momentum_values) / n

        numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, momentum_values))
        denominator = sum((x - x_mean) ** 2 for x in x_values)

        if denominator == 0:
            return momentum_values[-1]

        slope = numerator / denominator
        intercept = y_mean - slope * x_mean

        # Return the most recent fitted value
        return slope * (n - 1) + intercept

    def calculate_macd_histogram(self, bars: List[dict]) -> float:
        """Calculate MACD histogram."""
        if len(bars) < self.macd_slow:
            return 0.0

        closes = [bar['close'] for bar in bars]

        # Calculate EMAs
        fast_ema = self.calculate_ema(closes, self.macd_fast)
        slow_ema = self.calculate_ema(closes, self.macd_slow)

        # MACD line
        macd_line = fast_ema - slow_ema

        # Signal line (EMA of MACD)
        # Need to calculate MACD values for signal calculation
        macd_values = []
        for i in range(self.macd_slow - 1, len(closes)):
            fast = self.calculate_ema(closes[:i+1], self.macd_fast)
            slow = self.calculate_ema(closes[:i+1], self.macd_slow)
            macd_values.append(fast - slow)

        if len(macd_values) < self.macd_signal:
            return 0.0

        signal_line = self.calculate_ema(macd_values, self.macd_signal)

        # Histogram
        return macd_line - signal_line

    def calculate_ema(self, values: List[float], period: int) -> float:
        """Calculate Exponential Moving Average."""
        if len(values) < period:
            return values[-1] if values else 0.0

        # Start with SMA
        sma = sum(values[:period]) / period
        multiplier = 2 / (period + 1)

        ema = sma
        for value in values[period:]:
            ema = (value * multiplier) + (ema * (1 - multiplier))

        return ema

    def calculate_lowest_low(self, bars: List[dict]) -> float:
        """Calculate lowest low over specified period."""
        if len(bars) < self.stop_loss_length:
            return min(bar['low'] for bar in bars)

        return min(bar['low'] for bar in bars[-self.stop_loss_length:])

    def calculate_psar(self, symbol: str, bars: List[dict]) -> Optional[float]:
        """
        Calculate Parabolic SAR.
        Maintains state across calls for proper SAR calculation.
        """
        if len(bars) < 2:
            return None

        current_bar = bars[-1]
        prev_bar = bars[-2] if len(bars) > 1 else bars[-1]

        # Initialize PSAR on first calculation
        if self.psar_value[symbol] is None:
            # Start with simple logic: if price is rising, PSAR starts below
            if current_bar['close'] > prev_bar['close']:
                self.psar_trend[symbol] = 1  # Uptrend
                self.psar_value[symbol] = prev_bar['low']
                self.psar_ep[symbol] = current_bar['high']
            else:
                self.psar_trend[symbol] = -1  # Downtrend
                self.psar_value[symbol] = prev_bar['high']
                self.psar_ep[symbol] = current_bar['low']
            self.psar_af[symbol] = self.psar_start
            return self.psar_value[symbol]

        # Get previous values
        prev_psar = self.psar_value[symbol]
        trend = self.psar_trend[symbol]
        ep = self.psar_ep[symbol]
        af = self.psar_af[symbol]

        # Calculate new PSAR
        new_psar = prev_psar + af * (ep - prev_psar)

        # Check for trend reversal
        if trend == 1:  # Currently in uptrend
            # Check if price broke below PSAR (reversal to downtrend)
            if current_bar['low'] <= new_psar:
                # Trend reversal to downtrend
                self.psar_trend[symbol] = -1
                self.psar_value[symbol] = ep  # Use previous extreme point
                self.psar_ep[symbol] = current_bar['low']
                self.psar_af[symbol] = self.psar_start
            else:
                # Continue uptrend
                # Ensure PSAR doesn't exceed previous two bars' lows
                if len(bars) >= 2:
                    max_psar = min(prev_bar['low'], bars[-3]['low'] if len(bars) > 2 else prev_bar['low'])
                    new_psar = min(new_psar, max_psar)

                self.psar_value[symbol] = new_psar

                # Update extreme point and acceleration factor
                if current_bar['high'] > ep:
                    self.psar_ep[symbol] = current_bar['high']
                    self.psar_af[symbol] = min(af + self.psar_increment, self.psar_maximum)

        else:  # Currently in downtrend (trend == -1)
            # Check if price broke above PSAR (reversal to uptrend)
            if current_bar['high'] >= new_psar:
                # Trend reversal to uptrend
                self.psar_trend[symbol] = 1
                self.psar_value[symbol] = ep
                self.psar_ep[symbol] = current_bar['high']
                self.psar_af[symbol] = self.psar_start
            else:
                # Continue downtrend
                # Ensure PSAR doesn't exceed previous two bars' highs
                if len(bars) >= 2:
                    min_psar = max(prev_bar['high'], bars[-3]['high'] if len(bars) > 2 else prev_bar['high'])
                    new_psar = max(new_psar, min_psar)

                self.psar_value[symbol] = new_psar

                # Update extreme point and acceleration factor
                if current_bar['low'] < ep:
                    self.psar_ep[symbol] = current_bar['low']
                    self.psar_af[symbol] = min(af + self.psar_increment, self.psar_maximum)

        return self.psar_value[symbol]

    def check_entry_conditions(self, symbol: str, tick: TickData) -> Optional[Signal]:
        """Check if entry conditions are met."""
        # No entry if already in position
        if self.positions.get(symbol, 0) != 0:
            return None

        # Check anti-repaint protection
        current_bar_time = self.get_bar_time(tick.timestamp)
        # Use timezone-aware datetime for comparison
        min_time = datetime.min.replace(tzinfo=timezone.utc)
        if current_bar_time <= self.last_signal_bar.get(symbol, min_time):
            return None  # Already signaled on this bar

        indicators = self.cached_indicators.get(symbol, {})

        # Check TTM Squeeze is active
        if not indicators.get('ttm_squeeze', False):
            return None

        # Check signal source
        entry_signal = False
        signal_details = ""

        if self.signal_source == "MACD":
            macd_hist = indicators.get('macd_hist', 0)
            macd_hist_1 = indicators.get('macd_hist_1', 0)
            macd_hist_2 = indicators.get('macd_hist_2', 0)

            # MACD entry: histogram positive AND increasing
            if macd_hist > 0 and (macd_hist > macd_hist_1 or macd_hist > macd_hist_2):
                entry_signal = True
                signal_details = f"MACD={macd_hist:.2f}>{macd_hist_1:.2f}"

        else:  # TTM signal source
            ttm_mom = indicators.get('ttm_momentum', 0)
            ttm_mom_1 = indicators.get('ttm_momentum_1', 0)
            ttm_mom_2 = indicators.get('ttm_momentum_2', 0)

            # TTM entry: momentum positive AND increasing
            if ttm_mom > 0 and (ttm_mom > ttm_mom_1 or ttm_mom > ttm_mom_2):
                entry_signal = True
                signal_details = f"TTM={ttm_mom:.2f}>{ttm_mom_1:.2f}"

        if entry_signal:
            # Set initial stop loss
            stop_loss = indicators.get('lowest_low', tick.price - 50)

            # Record entry
            self.positions[symbol] = 1
            self.entry_prices[symbol] = tick.price
            self.stop_losses[symbol] = stop_loss
            self.using_psar[symbol] = False
            self.last_signal_bar[symbol] = current_bar_time

            comment = f"Entry: TTM Squeeze active, {signal_details}, Stop={stop_loss:.2f}"
            print(f"[PurpleReign.{symbol}] Entry signal at {tick.price:.2f}: {comment}")

            return Signal(
                action=SignalAction.BUY,
                symbol=symbol,
                strategy_name=self.name,
                price=tick.price,
                comment=comment
            )

        return None

    def check_exit_conditions(self, symbol: str, tick: TickData) -> Optional[Signal]:
        """Check if exit conditions are met."""
        if self.positions.get(symbol, 0) == 0:
            return None

        current_price = tick.price
        indicators = self.cached_indicators.get(symbol, {})

        # Update stop loss (check for PSAR transition)
        self.update_stop_loss(symbol, current_price, indicators)

        # Check for PSAR crossover
        psar = indicators.get('psar')
        if psar and self.using_psar[symbol]:
            # Check if we previously were below PSAR and now above (crossover)
            curr_psar_below = psar < current_price
            if self.prev_psar_below.get(symbol, False) and not curr_psar_below:
                comment = f"Exit: PSAR crossover at {psar:.2f}"
                print(f"[PurpleReign.{symbol}] PSAR crossover exit at {current_price:.2f}")
                return self.generate_exit_signal(symbol, current_price, comment)
            self.prev_psar_below[symbol] = curr_psar_below

        # Check stop loss hit
        if current_price <= self.stop_losses[symbol]:
            stop_type = "PSAR" if self.using_psar[symbol] else "Initial"
            comment = f"Exit: {stop_type} stop hit at {self.stop_losses[symbol]:.2f}"
            print(f"[PurpleReign.{symbol}] Stop loss exit at {current_price:.2f}")
            return self.generate_exit_signal(symbol, current_price, comment)

        return None

    def update_stop_loss(self, symbol: str, current_price: float, indicators: dict) -> None:
        """Update stop loss, potentially transitioning to PSAR."""
        psar = indicators.get('psar')
        if psar is None:
            return

        entry_price = self.entry_prices[symbol]

        # Transition to PSAR when:
        # 1. PSAR is below current price (bullish)
        # 2. PSAR is above entry price (protecting profit)
        if psar < current_price and psar > entry_price:
            if not self.using_psar[symbol]:
                print(f"[PurpleReign.{symbol}] Transitioning to PSAR stop at {psar:.2f} (entry: {entry_price:.2f})")
            self.stop_losses[symbol] = psar
            self.using_psar[symbol] = True
            self.prev_psar_below[symbol] = True  # PSAR is below price
        elif not self.using_psar[symbol]:
            # Keep using initial stop loss
            pass

    def generate_exit_signal(self, symbol: str, price: float, comment: str) -> Signal:
        """Generate exit signal and reset position state."""
        # Reset position state
        self.positions[symbol] = 0
        self.entry_prices[symbol] = 0
        self.stop_losses[symbol] = 0
        self.using_psar[symbol] = False
        self.prev_psar_below[symbol] = False

        return Signal(
            action=SignalAction.SELL,
            symbol=symbol,
            strategy_name=self.name,
            price=price,
            comment=comment
        )