const fs = require('fs');
const path = require('path');

// List of files that need fixing
const filesToFix = [
  './components/attendance/salary-info.tsx',
  './components/ui/badge.tsx',
  './components/settings/notification-settings-page.tsx',
  './components/site-info/SiteSearchModal.tsx',
  './components/site-info/ManagerContacts.tsx',
  './components/site-info/TodaySiteInfo.tsx',
  './components/materials/material-management.tsx',
  './components/materials/npc1000/NPC1000InventoryDashboard.tsx',
  './components/materials/npc1000/NPC1000Dashboard.tsx',
  './components/materials/materials-client.tsx',
  './components/markup/toolbar/top-toolbar.tsx',
  './components/markup/toolbar/bottom-statusbar.tsx',
  './components/markup/toolbar/tool-palette.tsx',
  './components/markup/list/markup-document-list.tsx',
  './components/markup/upload/blueprint-upload.tsx',
  './components/daily-reports/DailyReportListEnhanced.tsx',
  './components/documents/documents-page-client.tsx',
  './components/notifications/notifications-page.tsx'
];

filesToFix.forEach(filePath => {
  console.log(`Fixing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file needs getFullTypographyClass import
    const hasThreeParamCalls = /getTypographyClass\([^)]+,\s*[^)]+,\s*[^)]+\)/.test(content);
    
    if (hasThreeParamCalls) {
      // Add getFullTypographyClass import if needed
      if (!content.includes('getFullTypographyClass')) {
        content = content.replace(
          /import\s*{\s*([^}]*getTypographyClass[^}]*)\s*}\s*from\s*'@\/contexts\/FontSizeContext'/,
          'import { $1, getFullTypographyClass } from \'@/contexts/FontSizeContext\''
        );
      }
      
      // Replace 3-parameter calls with getFullTypographyClass
      content = content.replace(
        /getTypographyClass\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
        'getFullTypographyClass($1, $2, $3)'
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⏭️  Skipped ${filePath} (no 3-parameter calls found)`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log('Typography fix completed!');