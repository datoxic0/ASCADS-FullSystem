const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.js') && file !== 'sw.js' && file !== 'scratch_test.js' && file !== 'rename.js') {
    const tsFile = file.replace(/\.js$/, '.ts');
    fs.renameSync(path.join(dir, file), path.join(dir, tsFile));
    console.log(`Renamed ${file} to ${tsFile}`);
  }
}
