/**
 * Smart Boot System CLI
 * 
 * This script provides a command-line interface to the boot system,
 * allowing for manual inspection and testing of system components.
 */

import { bootSystem, getBootStatus, ComponentStatus } from './index';
import { exportHealthSnapshot, getLatestHealthSnapshot, getHealthSnapshotsList } from './health-snapshot';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

function printHeader() {
  console.log('\n');
  console.log(`${colors.bright}${colors.green}===================================${colors.reset}`);
  console.log(`${colors.bright}${colors.green}   NATURE BREED FARM BOOT SYSTEM   ${colors.reset}`);
  console.log(`${colors.bright}${colors.green}===================================${colors.reset}`);
  console.log('\n');
}

function printUsage() {
  console.log(`${colors.bright}Usage:${colors.reset}`);
  console.log(`  npx tsx server/boot/cli.ts [command]`);
  console.log('\n');
  console.log(`${colors.bright}Commands:${colors.reset}`);
  console.log(`  ${colors.green}boot${colors.reset}      - Run the full boot sequence and system check`);
  console.log(`  ${colors.green}status${colors.reset}    - Show the current boot status`);
  console.log(`  ${colors.green}snapshot${colors.reset}  - Export a health snapshot of the current system state`);
  console.log(`  ${colors.green}snapshots${colors.reset} - List all available health snapshots`);
  console.log(`  ${colors.green}help${colors.reset}      - Show this help message`);
  console.log('\n');
}

function printComponentStatus(component: ComponentStatus) {
  let statusColor = colors.green;
  let icon = '✅';
  
  if (component.status === 'warning') {
    statusColor = colors.yellow;
    icon = '⚠️';
  } else if (component.status === 'error') {
    statusColor = colors.red;
    icon = '❌';
  } else if (component.status === 'pending') {
    statusColor = colors.cyan;
    icon = '⏳';
  }
  
  console.log(`${icon} ${colors.bright}${component.name}:${colors.reset} ${statusColor}${component.status.toUpperCase()}${colors.reset}`);
  console.log(`   ${component.message}`);
  
  if (component.details) {
    console.log(`   ${colors.dim}Details:${colors.reset} ${colors.dim}${JSON.stringify(component.details, null, 2).replace(/\\n/g, '\n    ')}${colors.reset}`);
  }
  
  console.log();
}

// Function to handle the 'boot' command
async function runBoot() {
  console.log(`${colors.blue}Initiating system boot sequence...${colors.reset}`);
  const status = await bootSystem();
  
  console.log('\n');
  console.log(`${colors.bright}${colors.underscore}Boot Summary:${colors.reset}`);
  console.log('\n');
  
  // Color the overall status
  let statusColor = colors.green;
  let icon = '✅';
  
  if (status.overallStatus === 'warning') {
    statusColor = colors.yellow;
    icon = '⚠️';
  } else if (status.overallStatus === 'error') {
    statusColor = colors.red;
    icon = '❌';
  }
  
  console.log(`${colors.bright}Overall Status:${colors.reset} ${statusColor}${status.overallStatus.toUpperCase()}${colors.reset} ${icon}`);
  console.log(`${colors.bright}Boot Timestamp:${colors.reset} ${status.lastBootTimestamp}`);
  console.log(`${colors.bright}Environment:${colors.reset} ${status.environment}`);
  console.log('\n');
  
  console.log(`${colors.bright}${colors.underscore}Component Details:${colors.reset}`);
  console.log('\n');
  
  status.components.forEach(component => {
    printComponentStatus(component);
  });
  
  // If boot was successful, export a health snapshot
  if (status.overallStatus === 'success') {
    const snapshotResult = exportHealthSnapshot(status);
    if (snapshotResult.success) {
      console.log(`${colors.green}✅ Health snapshot exported: ${colors.reset}${snapshotResult.timestamp}`);
    }
  }
  
  return status;
}

// Function to handle the 'status' command
function showStatus() {
  const status = getBootStatus();
  
  console.log(`${colors.bright}${colors.underscore}Current System Status:${colors.reset}`);
  console.log('\n');
  
  // Color the overall status
  let statusColor = colors.green;
  let icon = '✅';
  
  if (status.overallStatus === 'warning') {
    statusColor = colors.yellow;
    icon = '⚠️';
  } else if (status.overallStatus === 'error') {
    statusColor = colors.red;
    icon = '❌';
  } else if (status.overallStatus === 'pending') {
    statusColor = colors.cyan;
    icon = '⏳';
  }
  
  console.log(`${colors.bright}Overall Status:${colors.reset} ${statusColor}${status.overallStatus.toUpperCase()}${colors.reset} ${icon}`);
  console.log(`${colors.bright}Last Boot:${colors.reset} ${status.lastBootTimestamp}`);
  console.log(`${colors.bright}Environment:${colors.reset} ${status.environment}`);
  console.log('\n');
  
  console.log(`${colors.bright}${colors.underscore}Component Status:${colors.reset}`);
  console.log('\n');
  
  status.components.forEach(component => {
    printComponentStatus(component);
  });
  
  return status;
}

// Function to handle the 'snapshot' command
function createSnapshot() {
  const status = getBootStatus();
  const result = exportHealthSnapshot(status);
  
  if (result.success) {
    console.log(`${colors.green}✅ Health snapshot exported: ${colors.reset}${result.timestamp}`);
    console.log(`${colors.green}✅ File: ${colors.reset}${result.filePath}`);
  } else {
    console.log(`${colors.red}❌ Failed to export health snapshot: ${colors.reset}${result.error}`);
  }
  
  return result;
}

// Function to handle the 'snapshots' command
function listSnapshots() {
  const snapshots = getHealthSnapshotsList();
  
  console.log(`${colors.bright}${colors.underscore}Available Health Snapshots:${colors.reset}`);
  console.log('\n');
  
  if (snapshots.length === 0) {
    console.log(`${colors.yellow}No health snapshots available${colors.reset}`);
  } else {
    snapshots.forEach((filename, index) => {
      console.log(`${index + 1}. ${filename}`);
    });
  }
  
  // Also show the latest snapshot info
  const latest = getLatestHealthSnapshot();
  console.log('\n');
  
  if (latest) {
    console.log(`${colors.bright}${colors.underscore}Latest Snapshot:${colors.reset}`);
    console.log('\n');
    console.log(`${colors.bright}Timestamp:${colors.reset} ${latest.lastBootTimestamp}`);
    console.log(`${colors.bright}Status:${colors.reset} ${latest.overallStatus.toUpperCase()}`);
    console.log(`${colors.bright}Components:${colors.reset} ${latest.components.length}`);
  } else {
    console.log(`${colors.yellow}No latest snapshot available${colors.reset}`);
  }
  
  return snapshots;
}

// Main function to parse arguments and run commands
async function main() {
  printHeader();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'boot';
  
  switch (command) {
    case 'boot':
      await runBoot();
      break;
    case 'status':
      showStatus();
      break;
    case 'snapshot':
      createSnapshot();
      break;
    case 'snapshots':
      listSnapshots();
      break;
    case 'help':
    default:
      printUsage();
      break;
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}❌ Error:${colors.reset} ${error.message}`);
  process.exit(1);
});