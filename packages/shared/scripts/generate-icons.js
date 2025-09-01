#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Icons we want to include (add more as needed)
const ICONS_TO_INCLUDE = [
  { name: 'arrowsDownToPeople', file: 'arrows-down-to-people.svg', style: 'regular' },
  { name: 'arrowRightFromBracket', file: 'arrow-right-from-bracket.svg', style: 'regular' },
  { name: 'gear', file: 'gear.svg', style: 'regular' },
  { name: 'table', file: 'table.svg', style: 'regular' },
  { name: 'users', file: 'users.svg', style: 'regular' },
  { name: 'userShield', file: 'user-shield.svg', style: 'solid' },
  { name: 'plus', file: 'plus.svg', style: 'regular' },
  { name: 'pencil', file: 'pencil.svg', style: 'regular' },
  { name: 'trash', file: 'trash.svg', style: 'regular' },
  { name: 'bars3', file: 'bars.svg', style: 'regular' },
  { name: 'xMark', file: 'xmark.svg', style: 'regular' },
  { name: 'calendarDays', file: 'calendar-days.svg', style: 'regular' },
  { name: 'tag', file: 'tag.svg', style: 'regular' },
  { name: 'user', file: 'user.svg', style: 'regular' },
];

const FONTAWESOME_DIR = path.join(__dirname, '../../../fontawesome/svgs');
const OUTPUT_FILE = path.join(__dirname, '../src/icons/icons.ts');

function processSvg(svgContent) {
  // Remove XML declaration and comments
  let processed = svgContent
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  
  // Add currentColor to make icon inherit text color
  processed = processed.replace(/<svg/, '<svg fill="currentColor"');
  
  // Ensure SVG has proper class handling
  if (!processed.includes('class=')) {
    processed = processed.replace(/<svg/, '<svg class="fa-icon"');
  }
  
  return processed;
}

function generateIcons() {
  let iconExports = [];
  let iconImports = "// Auto-generated file - do not edit directly\n";
  iconImports += "// Run 'npm run generate-icons' to update\n\n";
  
  console.log('Generating icons from FontAwesome SVGs...');
  
  for (const icon of ICONS_TO_INCLUDE) {
    const svgPath = path.join(FONTAWESOME_DIR, icon.style, icon.file);
    
    if (!fs.existsSync(svgPath)) {
      console.warn(`Warning: Icon not found: ${svgPath}`);
      continue;
    }
    
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const processedSvg = processSvg(svgContent);
    
    // Export as a constant
    iconImports += `export const ${icon.name} = \`${processedSvg}\`;\n\n`;
    iconExports.push(icon.name);
    
    console.log(`✓ Generated ${icon.name} from ${icon.style}/${icon.file}`);
  }
  
  // Add a type export for all icons
  iconImports += `// Available icons\n`;
  iconImports += `export type IconName = ${iconExports.map(name => `'${name}'`).join(' | ')};\n\n`;
  
  // Add a record of all icons for dynamic access
  iconImports += `export const icons = {\n`;
  iconExports.forEach(name => {
    iconImports += `  ${name},\n`;
  });
  iconImports += `} as const;\n`;
  
  // Write the output file
  fs.writeFileSync(OUTPUT_FILE, iconImports);
  console.log(`\n✅ Generated ${iconExports.length} icons to ${OUTPUT_FILE}`);
}

// Run the generator
generateIcons();