const STORAGE_KEY = 'atomik_tv_charts';

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function generateId() {
  return `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const chartStorage = {
  // Returns Promise<ChartMetaInfo[]>
  getAllCharts() {
    return Promise.resolve().then(() => {
      const store = readStore();
      return Object.keys(store).map((id) => ({
        id,
        name: store[id].name || '',
        symbol: store[id].symbol || '',
        resolution: store[id].resolution || '',
        timestamp: store[id].timestamp || 0,
      }));
    });
  },

  // Saves chart, returns Promise<string> (chart ID)
  saveChart(chartData) {
    return Promise.resolve().then(() => {
      const store = readStore();
      const id = chartData.id || generateId();
      store[id] = {
        id,
        name: chartData.name || '',
        symbol: chartData.symbol || '',
        resolution: chartData.resolution || '',
        content: chartData.content || '',
        timestamp: Date.now(),
      };
      writeStore(store);
      return id;
    });
  },

  // Returns Promise<string> (chart content)
  getChartContent(chartId) {
    return Promise.resolve().then(() => {
      const store = readStore();
      const chart = store[chartId];
      if (!chart) {
        throw new Error(`Chart not found: ${chartId}`);
      }
      return chart.content || '';
    });
  },

  // Returns Promise<void>
  removeChart(chartId) {
    return Promise.resolve().then(() => {
      const store = readStore();
      delete store[chartId];
      writeStore(store);
    });
  },
};
