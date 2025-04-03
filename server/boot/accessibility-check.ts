import fs from 'fs';
import path from 'path';
import { BootModule } from './types';

/**
 * Accessibility check module for the boot system
 * This module scans the frontend codebase for common accessibility issues
 * and reports them as warnings
 */
export const accessibilityCheck: BootModule = {
  name: 'accessibility',
  description: 'Checks frontend components for accessibility issues',
  
  async check() {
    try {
      // Start with all checks passing
      const issues: string[] = [];
      
      // Define the directory to scan - client/src/components
      const componentsDir = path.join(process.cwd(), 'client', 'src', 'components');
      
      // Check if directory exists
      if (!fs.existsSync(componentsDir)) {
        return {
          status: 'error',
          message: `Components directory not found: ${componentsDir}`,
        };
      }
      
      // Recursively scan all tsx files
      const tsxFiles = await scanForTsxFiles(componentsDir);
      
      // Check each file for accessibility issues
      for (const file of tsxFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for DialogContent without DialogTitle
        if (content.includes('DialogContent') && !content.includes('DialogTitle')) {
          // Verify this isn't a false positive (like importing but not using)
          if (hasDialogContentWithoutTitle(content)) {
            issues.push(`${path.relative(process.cwd(), file)}: DialogContent without DialogTitle`);
          }
        }
        
        // Check for buttons without accessible text (can expand later)
        if (content.includes('<Button') && !content.includes('aria-label') && content.includes('icon-only')) {
          issues.push(`${path.relative(process.cwd(), file)}: Icon-only Button without aria-label`);
        }
        
        // Check for form fields without labels
        if ((content.includes('<Input') || content.includes('<Select')) && 
            !content.includes('<FormLabel') && !content.includes('<Label') && 
            !content.includes('aria-label')) {
          issues.push(`${path.relative(process.cwd(), file)}: Form control without label`);
        }
      }
      
      // If no issues were found
      if (issues.length === 0) {
        return {
          status: 'success',
          message: 'No accessibility issues detected in component files',
        };
      }
      
      // If issues were found
      return {
        status: 'warning',
        message: `${issues.length} accessibility issues detected`,
        details: issues,
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to check accessibility: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
};

/**
 * Helper function to recursively scan for .tsx files
 */
async function scanForTsxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...await scanForTsxFiles(fullPath));
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Helper function to check if a file has DialogContent without DialogTitle
 * This does more sophisticated checking to avoid false positives
 */
function hasDialogContentWithoutTitle(content: string): boolean {
  // Simple regex to find DialogContent components
  const dialogContentRegex = /<DialogContent[^>]*>/g;
  const matches = content.match(dialogContentRegex);
  
  if (!matches) return false;
  
  // Look for DialogTitle within a reasonable distance after DialogContent
  for (const match of matches) {
    const index = content.indexOf(match);
    const segment = content.substring(index, index + 500); // Check next 500 chars
    
    // If this segment doesn't include DialogTitle and also doesn't include VisuallyHidden
    if (!segment.includes('DialogTitle') && !segment.includes('VisuallyHidden')) {
      return true;
    }
  }
  
  return false;
}