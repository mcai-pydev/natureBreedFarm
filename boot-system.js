#!/usr/bin/env node

/**
 * Smart Boot System CLI Runner
 * 
 * Use this script to check the status of all system components:
 * npx tsx server/boot/cli.ts
 * 
 * Or directly:
 * npx tsx boot-system.js
 */

// Simple wrapper to execute the TypeScript CLI
require('child_process').spawn('npx', ['tsx', 'server/boot/cli.ts'].concat(process.argv.slice(2)), {
  stdio: 'inherit',
  shell: true
});