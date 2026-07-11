const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootPath = path.resolve(__dirname, '../../');
const pnpmWorkspace = path.join(rootPath, 'pnpm-workspace.yaml');
const pnpmLock = path.join(rootPath, 'pnpm-lock.yaml');

console.log('Hiding pnpm files from electron-builder...');
if (fs.existsSync(pnpmWorkspace)) fs.renameSync(pnpmWorkspace, pnpmWorkspace + '.bak');
if (fs.existsSync(pnpmLock)) fs.renameSync(pnpmLock, pnpmLock + '.bak');

try {
    console.log('Running electron-builder...');
    execSync('npx electron-builder --win', { stdio: 'inherit' });
    console.log('Electron build success!');
} catch (error) {
    console.error('Electron build failed!', error.message);
} finally {
    console.log('Restoring pnpm files...');
    if (fs.existsSync(pnpmWorkspace + '.bak')) fs.renameSync(pnpmWorkspace + '.bak', pnpmWorkspace);
    if (fs.existsSync(pnpmLock + '.bak')) fs.renameSync(pnpmLock + '.bak', pnpmLock);
}
