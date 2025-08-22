#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// All files that need fixing based on the grep output
const filesToFix = [
  // Admin components
  './components/admin/AdminDataTable.tsx',
  './components/admin/AdminPageLayout.tsx',
  './components/admin/AdminPermissionValidator.tsx',
  './components/admin/DocumentManagement.tsx',
  './components/admin/MarkupManagement.tsx',
  './components/admin/MaterialsManagement.tsx',
  './components/admin/SalaryManagement.tsx',
  './components/admin/SiteManagement.tsx',
  './components/admin/SystemManagement.tsx',
  './components/admin/UserManagement.tsx',
  
  // Attendance components
  './components/attendance/attendance-detail.tsx',
  './components/attendance/daily-attendance-report.tsx',
  './components/attendance/salary-statement.tsx',
  
  // Daily reports components
  './components/daily-reports/DailyReportDetailView.tsx',
  './components/daily-reports/daily-report-detail-new.tsx',
  './components/daily-reports/daily-report-list.tsx',
  
  // Dashboard components
  './components/dashboard/sidebar.tsx',
  './components/dashboard/tabs/daily-report-tab.tsx',
  './components/dashboard/tabs/home-tab.tsx',
  
  // Documents components
  './components/documents/my-documents.tsx',
  './components/documents/shared-documents.tsx',
  
  // Materials components
  './components/materials/material-catalog.tsx',
  './components/materials/material-transactions.tsx',
  './components/materials/MaterialUsageDialog.tsx',
  './components/materials/npc1000/NPC1000DocumentList.tsx',
  './components/materials/npc1000/NPC1000EntryDialog.tsx',
  './components/materials/npc1000/NPC1000UsageDialog.tsx',
  
  // UI components
  './components/ui/bottom-navigation.tsx',
  './components/ui/button.tsx',
  './components/ui/label.tsx',
  './components/ui/input.tsx',
  './components/ui/textarea.tsx',
  './components/ui/card.tsx',
  './components/ui/select.tsx',
  './components/ui/select-new.tsx',
  './components/ui/tabs.tsx'
];

filesToFix.forEach(filePath => {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace import
    content = content.replace(
      /import\s*{\s*([^}]*)\s*getTypographyClass\s*([^}]*)\s*}\s*from\s*['"]@\/contexts\/FontSizeContext['"]/g,
      (match, before, after) => {
        // Check if getFullTypographyClass is already imported
        if (match.includes('getFullTypographyClass')) {
          return match;
        }
        return `import { ${before || ''} getTypographyClass, getFullTypographyClass ${after || ''}} from '@/contexts/FontSizeContext'`;
      }
    );
    
    // Replace 3-parameter calls with getFullTypographyClass
    content = content.replace(
      /getTypographyClass\s*\(\s*['"](\w+)['"]\s*,\s*['"](\w+)['"]\s*,\s*(\w+)\s*\)/g,
      'getFullTypographyClass(\'$1\', \'$2\', $3)'
    );
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('Done!');