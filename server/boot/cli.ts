#!/usr/bin/env node
/**
 * Command-line interface for the Smart Boot System
 */

import { bootSystem, getBootStatus, BootStatus } from './index';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES Module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

/**
 * Display boot status in a formatted table
 */
function displayBootStatus(status: BootStatus): void {
  console.log(`\n${COLORS.bright}${COLORS.cyan}=== Nature Breed Farm Smart Boot System ===${COLORS.reset}\n`);
  
  console.log(`${COLORS.gray}Environment: ${COLORS.reset}${status.environment}`);
  console.log(`${COLORS.gray}Last Boot: ${COLORS.reset}${new Date(status.lastBootTimestamp).toLocaleString()}\n`);
  
  // Table header
  console.log(`${COLORS.bright}Component${COLORS.reset.padEnd(20)} | ${COLORS.bright}Status${COLORS.reset.padEnd(10)} | ${COLORS.bright}Message${COLORS.reset}`);
  console.log('-'.repeat(80));
  
  // Sort components by status (error first, then warning, then success)
  const sortedComponents = [...status.components].sort((a, b) => {
    const order = { error: 0, warning: 1, success: 2, pending: 3 };
    return order[a.status] - order[b.status];
  });
  
  // Table rows
  sortedComponents.forEach(component => {
    const statusColor = 
      component.status === 'success' ? COLORS.green :
      component.status === 'warning' ? COLORS.yellow :
      component.status === 'error' ? COLORS.red :
      COLORS.gray;
    
    const statusIcon =
      component.status === 'success' ? '✅' :
      component.status === 'warning' ? '⚠️' :
      component.status === 'error' ? '❌' :
      '⏳';
    
    console.log(
      `${COLORS.cyan}${component.name.padEnd(20)}${COLORS.reset} | ` +
      `${statusColor}${statusIcon} ${component.status.padEnd(7)}${COLORS.reset} | ` +
      `${component.message}`
    );
  });
  
  // Overall status footer
  console.log('-'.repeat(80));
  const overallStatusColor = 
    status.overallStatus === 'success' ? COLORS.green :
    status.overallStatus === 'warning' ? COLORS.yellow :
    status.overallStatus === 'error' ? COLORS.red :
    COLORS.gray;
  
  const overallIcon =
    status.overallStatus === 'success' ? '✅' :
    status.overallStatus === 'warning' ? '⚠️' :
    status.overallStatus === 'error' ? '❌' :
    '⏳';
  
  console.log(`${COLORS.bright}Overall${COLORS.reset.padEnd(20)} | ${overallStatusColor}${overallIcon} ${status.overallStatus.toUpperCase()}${COLORS.reset}\n`);
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  try {
    switch (command) {
      case 'boot':
      case 'start':
        console.log(`${COLORS.cyan}Starting boot process...${COLORS.reset}`);
        const bootResult = await bootSystem();
        displayBootStatus(bootResult);
        
        if (bootResult.overallStatus === 'error') {
          process.exit(1);
        }
        break;
        
      case 'status':
        const currentStatus = getBootStatus();
        if (currentStatus.components.length === 0) {
          console.log(`${COLORS.yellow}No boot status found. Run with 'boot' to initialize the system.${COLORS.reset}`);
        } else {
          displayBootStatus(currentStatus);
        }
        break;
        
      case 'reset':
        const STATUS_FILE_PATH = path.join(__dirname, '../../boot-status.json');
        if (fs.existsSync(STATUS_FILE_PATH)) {
          fs.unlinkSync(STATUS_FILE_PATH);
          console.log(`${COLORS.green}Boot status has been reset.${COLORS.reset}`);
        } else {
          console.log(`${COLORS.yellow}No boot status file found.${COLORS.reset}`);
        }
        break;
        
      case 'help':
      default:
        console.log(`
${COLORS.cyan}Nature Breed Farm Smart Boot System${COLORS.reset}

Usage:
  ${COLORS.bright}npx tsx server/boot/cli.ts <command>${COLORS.reset}

Commands:
  ${COLORS.bright}boot, start${COLORS.reset}    Run the boot process to check all components
  ${COLORS.bright}status${COLORS.reset}         Show the current boot status (default)
  ${COLORS.bright}reset${COLORS.reset}          Reset the boot status file
  ${COLORS.bright}help${COLORS.reset}           Show this help message
        `);
    }
  } catch (error) {
    console.error(`${COLORS.red}Error during execution:${COLORS.reset}`, error);
    process.exit(1);
  }
}

main();