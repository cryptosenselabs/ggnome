const fs = require('fs');
const path = require('path');

function replaceColor(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.next') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      replaceColor(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      if (content.includes('#635bff') || content.includes('635BFF') || content.includes('rgba(99, 91, 255')) {
        content = content.replace(/#635bff/gi, '#dc2626');
        content = content.replace(/rgba\(99, 91, 255, 0\.3\)/g, 'rgba(220, 38, 38, 0.3)');
        changed = true;
      }
      
      // Also update hover states that were paired with the primary button
      if (content.includes('hover:bg-[#0a2540]')) {
        content = content.replace(/hover:bg-\[#0a2540\]/g, 'hover:bg-[#b91c1c]');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
}

replaceColor(__dirname);
