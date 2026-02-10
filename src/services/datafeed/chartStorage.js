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

  // Study template methods required by TradingView when study_templates is enabled
  getAllStudyTemplates() {
    return Promise.resolve().then(() => {
      const raw = localStorage.getItem('atomik_tv_study_templates');
      return raw ? JSON.parse(raw) : [];
    });
  },

  saveStudyTemplate(studyTemplateData) {
    return Promise.resolve().then(() => {
      const raw = localStorage.getItem('atomik_tv_study_templates');
      const templates = raw ? JSON.parse(raw) : [];
      const existing = templates.findIndex((t) => t.name === studyTemplateData.name);
      if (existing >= 0) {
        templates[existing] = studyTemplateData;
      } else {
        templates.push(studyTemplateData);
      }
      localStorage.setItem('atomik_tv_study_templates', JSON.stringify(templates));
    });
  },

  removeStudyTemplate(studyTemplateData) {
    return Promise.resolve().then(() => {
      const raw = localStorage.getItem('atomik_tv_study_templates');
      const templates = raw ? JSON.parse(raw) : [];
      const filtered = templates.filter((t) => t.name !== studyTemplateData.name);
      localStorage.setItem('atomik_tv_study_templates', JSON.stringify(filtered));
    });
  },

  getStudyTemplateContent(studyTemplateData) {
    return Promise.resolve().then(() => {
      const raw = localStorage.getItem('atomik_tv_study_templates');
      const templates = raw ? JSON.parse(raw) : [];
      const found = templates.find((t) => t.name === studyTemplateData.name);
      return found || null;
    });
  },
};
