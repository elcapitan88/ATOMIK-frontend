const fs = require('fs').promises;
const path = require('path');

// Map of old paths to new paths
const pathMappings = {
  './TradesTable': '@features/trading/TradesTable',
  './TradingViewWidget': '@features/trading/TradingViewWidget',
  './tradesTableUtils': '@features/trading/tradesTableUtils',
  './Webhooks': '@features/webhooks/Webhooks',
  './WebhookModal': '@features/webhooks/WebhookModal',
  './WebhookDetailsModal': '@features/webhooks/WebhookDetailsModal',
  './ActivateStrategies': '@features/strategies/ActivateStrategies',
  './ActivateStrategyModal': '@features/strategies/ActivateStrategyModal',
  './DeleteStrategy': '@features/strategies/DeleteStrategy',
  './Strategies': '@features/strategies/Strategies',
  './DeleteAccount': '@common/Modal/DeleteAccount',
  './DeleteWebhook': '@common/Modal/DeleteWebhook',
  '../axiosConfig': '@services/axiosConfig',
  './TradovateWebSocket': '@services/tradovateWS',
  '../services/websocket': '@services/websocket'
};

// Helper function to check if directory exists
async function directoryExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

// Helper function to ensure directory exists
async function ensureDirectoryExists(dirPath) {
  if (!(await directoryExists(dirPath))) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function processDirectory(dir) {
  if (!(await directoryExists(dir))) {
    console.log(`Directory does not exist: ${dir}`);
    return;
  }

  const files = await fs.readdir(dir);
  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    
    const filePath = path.join(dir, file);
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    // Update import statements
    for (const [oldPath, newPath] of Object.entries(pathMappings)) {
      const importRegex = new RegExp(`import\\s+(.+)\\s+from\\s+['"]${oldPath}['"]`, 'g');
      const newContent = content.replace(importRegex, `import $1 from '${newPath}'`);
      
      const relativeRegex = new RegExp(`import\\s+(.+)\\s+from\\s+[']\\.\\./components/${oldPath.replace('./', '')}['"]`, 'g');
      const newContent2 = newContent.replace(relativeRegex, `import $1 from '${newPath}'`);
      
      if (content !== newContent2) {
        content = newContent2;
        updated = true;
      }
    }
    
    if (updated) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`Updated imports in ${filePath}`);
    }
  }
}

async function updateImports() {
  const directories = [
    'src/components/features/trading',
    'src/components/features/webhooks',
    'src/components/features/strategies',
    'src/components/common/Modal',
    'src/pages',
    'src/services'
  ];

  try {
    for (const dir of directories) {
      await processDirectory(dir);
    }
    console.log('All imports updated successfully!');
  } catch (error) {
    console.error('Error updating imports:', error);
  }
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backup-${timestamp}`;
  
  try {
    await ensureDirectoryExists(backupDir);
    
    const directories = [
      'src/components/features/trading',
      'src/components/features/webhooks',
      'src/components/features/strategies',
      'src/components/common/Modal',
      'src/pages',
      'src/services'
    ];

    for (const dir of directories) {
      if (!(await directoryExists(dir))) {
        console.log(`Skipping backup of non-existent directory: ${dir}`);
        continue;
      }

      const files = await fs.readdir(dir);
      for (const file of files) {
        if (!file.endsWith('.js')) continue;
        
        const sourceFile = path.join(dir, file);
        const backupFile = path.join(backupDir, dir.replace('src/', ''), file);
        
        await ensureDirectoryExists(path.dirname(backupFile));
        await fs.copyFile(sourceFile, backupFile);
      }
    }
    console.log(`Backup created in ${backupDir}`);
  } catch (error) {
    console.error('Error creating backup:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('Creating backup...');
  await createBackup();
  
  console.log('Updating imports...');
  await updateImports();
}

main();