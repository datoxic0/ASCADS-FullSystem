const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/Asikhule Safetify/Desktop/ASCAD/VoltLogicPro-main/src';
const destDir = 'C:/Users/Asikhule Safetify/Desktop/ASCAD/Advanced-Schematic-Design-FullSystem-main/artifacts/logic-lab/src';

const mappings = [
  {
    from: path.join(srcDir, 'types.ts'),
    to: path.join(destDir, 'lib/plc-types.ts')
  },
  {
    from: path.join(srcDir, 'simulator.ts'),
    to: path.join(destDir, 'lib/plc-simulator.ts')
  },
  {
    from: path.join(srcDir, 'lib/audio.ts'),
    to: path.join(destDir, 'lib/audio.ts')
  },
  {
    from: path.join(srcDir, 'App.tsx'),
    to: path.join(destDir, 'pages/PLCPage.tsx')
  }
];

// Add all components
const componentsDir = path.join(srcDir, 'components');
const components = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
components.forEach(c => {
  mappings.push({
    from: path.join(componentsDir, c),
    to: path.join(destDir, 'components/plc', c)
  });
});

function processFile(fromPath, toPath) {
  let content = fs.readFileSync(fromPath, 'utf8');

  // Common replacements for components
  content = content.replace(/from '\.\.\/types'/g, "from '@/lib/plc-types'");
  content = content.replace(/from "\.\.\/types"/g, 'from "@/lib/plc-types"');
  content = content.replace(/from '\.\.\/simulator'/g, "from '@/lib/plc-simulator'");
  content = content.replace(/from "\.\.\/simulator"/g, 'from "@/lib/plc-simulator"');
  content = content.replace(/from '\.\.\/lib\/audio'/g, "from '@/lib/audio'");
  content = content.replace(/from "\.\.\/lib\/audio"/g, 'from "@/lib/audio"');

  // Common replacements for App.tsx (now PLCPage.tsx)
  content = content.replace(/from '\.\/types'/g, "from '@/lib/plc-types'");
  content = content.replace(/from "\.\/types"/g, 'from "@/lib/plc-types"');
  content = content.replace(/from '\.\/simulator'/g, "from '@/lib/plc-simulator'");
  content = content.replace(/from "\.\/simulator"/g, 'from "@/lib/plc-simulator"');
  content = content.replace(/from '\.\/lib\/audio'/g, "from '@/lib/audio'");
  content = content.replace(/from "\.\/lib\/audio"/g, 'from "@/lib/audio"');
  content = content.replace(/from '\.\/components\//g, "from '@/components/plc/");
  content = content.replace(/from "\.\/components\//g, 'from "@/components/plc/');
  
  // App.tsx uses `export default function App()` -> change to PLCPage
  if (toPath.endsWith('PLCPage.tsx')) {
    content = content.replace(/export default function App\(\)/g, 'export default function PLCPage()');
  }

  // Ensure destination directory exists
  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  
  fs.writeFileSync(toPath, content, 'utf8');
  console.log(`Migrated: ${path.basename(fromPath)} -> ${path.relative(destDir, toPath)}`);
}

mappings.forEach(m => processFile(m.from, m.to));
console.log('Migration completed successfully.');
