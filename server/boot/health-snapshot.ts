/**
 * Health Snapshot Utility
 * 
 * This module exports health snapshots for successful boot processes.
 * Snapshots are stored as timestamped JSON files in the health-snapshots directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BootStatus } from './index';

// ES Module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory to store health snapshots
const SNAPSHOTS_DIR = path.join(__dirname, '../../health-snapshots');

// Create snapshots directory if it doesn't exist
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  try {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create snapshots directory:', error);
  }
}

/**
 * Export a health snapshot for a successful boot
 * 
 * @param status The boot status object
 * @returns Information about the exported snapshot
 */
export function exportHealthSnapshot(status: BootStatus): {
  success: boolean;
  filePath?: string;
  timestamp: string;
  error?: string;
} {
  // Only export snapshots for successful boots
  if (status.overallStatus !== 'success') {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: 'Only successful boots can be exported as snapshots'
    };
  }
  
  try {
    // Create a filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `health-snapshot-${timestamp}.json`;
    const filePath = path.join(SNAPSHOTS_DIR, filename);
    
    // Create a snapshot object with additional metadata
    const snapshot = {
      ...status,
      snapshot: {
        exportedAt: timestamp,
        appVersion: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        hostname: process.env.HOSTNAME || 'unknown'
      }
    };
    
    // Write snapshot to file
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
    
    // Also update latest-snapshot.json for quick access
    const latestFilePath = path.join(SNAPSHOTS_DIR, 'latest-snapshot.json');
    fs.writeFileSync(latestFilePath, JSON.stringify(snapshot, null, 2));
    
    console.log(`🔄 Health snapshot exported: ${filename}`);
    
    return {
      success: true,
      filePath,
      timestamp
    };
  } catch (error) {
    console.error('Failed to export health snapshot:', error);
    
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get the latest health snapshot
 * 
 * @returns The latest health snapshot or null if none exists
 */
export function getLatestHealthSnapshot(): BootStatus | null {
  try {
    const latestFilePath = path.join(SNAPSHOTS_DIR, 'latest-snapshot.json');
    
    if (fs.existsSync(latestFilePath)) {
      const snapshotData = fs.readFileSync(latestFilePath, 'utf-8');
      return JSON.parse(snapshotData);
    }
    
    return null;
  } catch (error) {
    console.error('Failed to read latest health snapshot:', error);
    return null;
  }
}

/**
 * Get a list of all available health snapshots
 * 
 * @returns Array of snapshot filenames
 */
export function getHealthSnapshotsList(): string[] {
  try {
    if (!fs.existsSync(SNAPSHOTS_DIR)) {
      return [];
    }
    
    return fs.readdirSync(SNAPSHOTS_DIR)
      .filter(filename => filename !== 'latest-snapshot.json' && filename.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    console.error('Failed to list health snapshots:', error);
    return [];
  }
}

/**
 * Get a specific health snapshot by filename
 * 
 * @param filename The snapshot filename
 * @returns The health snapshot or null if it doesn't exist
 */
export function getHealthSnapshot(filename: string): BootStatus | null {
  try {
    const filePath = path.join(SNAPSHOTS_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      const snapshotData = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(snapshotData);
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to read health snapshot ${filename}:`, error);
    return null;
  }
}