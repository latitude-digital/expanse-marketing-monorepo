const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Lighthouse CI configuration
const lighthouseCIConfig = {
  ci: {
    collect: {
      url: [
        'http://localhost:8001/',
        'http://localhost:8001/admin'
      ],
      startServerCommand: 'pnpm dev',
      startServerReadyPattern: 'Local:\\s*http://localhost:8001',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};

// Write Lighthouse CI config
fs.writeFileSync(
  path.join(__dirname, '..', 'lighthouserc.json'),
  JSON.stringify(lighthouseCIConfig, null, 2)
);

// Performance budget configuration
const performanceBudget = {
  budget: [
    {
      resourceType: 'script',
      budget: 600 // 600KB max for all scripts
    },
    {
      resourceType: 'total',
      budget: 2000 // 2MB max total
    },
    {
      resourceType: 'image',
      budget: 200 // 200KB max for images
    }
  ]
};

// Bundle analyzer function
function analyzeBundles() {
  console.log('🔍 Analyzing bundle sizes...');
  
  try {
    // Build the application
    execSync('pnpm build', { stdio: 'inherit' });
    
    // Get build directory stats
    const buildDir = path.join(__dirname, '..', 'build');
    const stats = getBuildStats(buildDir);
    
    console.log('\n📊 Bundle Analysis Results:');
    console.log('================================');
    
    Object.entries(stats.assets).forEach(([file, size]) => {
      const sizeInKB = (size / 1024).toFixed(2);
      const sizeInMB = (size / (1024 * 1024)).toFixed(2);
      
      let status = '✅';
      if (file.endsWith('.js') && size > 500 * 1024) status = '⚠️';
      if (size > 1024 * 1024) status = '❌';
      
      console.log(`${status} ${file}: ${sizeInKB}KB (${sizeInMB}MB)`);
    });
    
    console.log(`\n📈 Total Bundle Size: ${(stats.totalSize / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`📦 Total Files: ${stats.fileCount}`);
    
    // Check against performance budget
    checkPerformanceBudget(stats, performanceBudget.budget);
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

function getBuildStats(buildDir) {
  const stats = {
    assets: {},
    totalSize: 0,
    fileCount: 0
  };
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else {
        const relativePath = path.relative(buildDir, filePath);
        const size = stat.size;
        
        stats.assets[relativePath] = size;
        stats.totalSize += size;
        stats.fileCount++;
      }
    });
  }
  
  scanDirectory(buildDir);
  return stats;
}

function checkPerformanceBudget(stats, budget) {
  console.log('\n💰 Performance Budget Check:');
  console.log('============================');
  
  let budgetPassed = true;
  
  budget.forEach(budgetRule => {
    const { resourceType, budget: maxSize } = budgetRule;
    const maxSizeInBytes = maxSize * 1024; // Convert KB to bytes
    
    let actualSize = 0;
    let matchingFiles = [];
    
    if (resourceType === 'script') {
      Object.entries(stats.assets).forEach(([file, size]) => {
        if (file.endsWith('.js')) {
          actualSize += size;
          matchingFiles.push(file);
        }
      });
    } else if (resourceType === 'image') {
      Object.entries(stats.assets).forEach(([file, size]) => {
        if (file.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
          actualSize += size;
          matchingFiles.push(file);
        }
      });
    } else if (resourceType === 'total') {
      actualSize = stats.totalSize;
      matchingFiles = Object.keys(stats.assets);
    }
    
    const actualSizeInKB = Math.round(actualSize / 1024);
    const status = actualSize <= maxSizeInBytes ? '✅' : '❌';
    
    if (actualSize > maxSizeInBytes) {
      budgetPassed = false;
    }
    
    console.log(`${status} ${resourceType}: ${actualSizeInKB}KB / ${maxSize}KB`);
    
    if (actualSize > maxSizeInBytes) {
      console.log(`   ⚠️  Budget exceeded by ${actualSizeInKB - maxSize}KB`);
      if (matchingFiles.length <= 5) {
        console.log(`   📄 Files: ${matchingFiles.join(', ')}`);
      } else {
        console.log(`   📄 ${matchingFiles.length} files (showing first 5): ${matchingFiles.slice(0, 5).join(', ')}...`);
      }
    }
  });
  
  if (!budgetPassed) {
    console.log('\n❌ Performance budget check failed!');
    console.log('💡 Consider:');
    console.log('   - Code splitting large bundles');
    console.log('   - Lazy loading non-critical features');
    console.log('   - Removing unused dependencies');
    console.log('   - Optimizing images');
    process.exit(1);
  } else {
    console.log('\n✅ Performance budget check passed!');
  }
}

// Core Web Vitals monitoring setup
function setupWebVitalsMonitoring() {
  const webVitalsScript = `
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  console.log('📊 Web Vital:', metric.name, metric.value);
  
  // Send to analytics service (Firebase, Google Analytics, etc.)
  // Example:
  // gtag('event', metric.name, {
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   event_label: metric.id,
  //   non_interaction: true,
  // });
}

// Measure all Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
`;

  const webVitalsPath = path.join(__dirname, '..', 'src', 'utils', 'webVitals.ts');
  fs.writeFileSync(webVitalsPath, webVitalsScript);
  
  console.log('✅ Web Vitals monitoring setup complete');
}

// Main function
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'analyze':
      analyzeBundles();
      break;
    case 'lighthouse':
      console.log('🚀 Running Lighthouse CI...');
      try {
        execSync('npx @lhci/cli@0.12.x autorun', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Lighthouse CI failed:', error.message);
        process.exit(1);
      }
      break;
    case 'webvitals':
      setupWebVitalsMonitoring();
      break;
    case 'all':
      analyzeBundles();
      setupWebVitalsMonitoring();
      console.log('\n🎉 Performance analysis complete!');
      break;
    default:
      console.log('Usage: node lighthouse-ci.js [analyze|lighthouse|webvitals|all]');
      process.exit(1);
  }
}

main();