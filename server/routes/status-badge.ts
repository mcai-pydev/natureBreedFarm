import { getBootStatus } from '../boot/index';
import { Request, Response } from 'express';

/**
 * Handles the request for a Markdown status badge
 * Returns a markdown-formatted string with the current system status
 */
export function getStatusBadge(req: Request, res: Response) {
  const status = getBootStatus();
  const timestamp = new Date(status.lastBootTimestamp).toISOString().split('T')[0];
  
  // Count module statuses
  const totalModules = status.components.length;
  const passingModules = status.components.filter(c => c.status === 'success').length;
  const warningModules = status.components.filter(c => c.status === 'warning').length;
  const errorModules = status.components.filter(c => c.status === 'error').length;
  
  // Status emoji
  const statusEmoji = status.overallStatus === 'success' ? '✅' : 
                      status.overallStatus === 'warning' ? '⚠️' : '❌';
                      
  // Generate markdown badge
  const badge = `
🩺 System Boot Status: ${statusEmoji} ${status.overallStatus === 'success' ? 'All systems operational' :
  status.overallStatus === 'warning' ? 'Some systems degraded' : 'Critical systems failing'}
🧪 Last Check: ${timestamp}
📦 Modules Checked: ${totalModules} | ✅ ${passingModules} | ⚠️ ${warningModules} | ❌ ${errorModules}
`;

  // Set Content-Type for Markdown
  res.setHeader('Content-Type', 'text/markdown');
  res.send(badge.trim());
}

/**
 * Handles the request for a HTML status badge
 * Returns an HTML-formatted badge with the current system status
 */
export function getStatusBadgeHtml(req: Request, res: Response) {
  const status = getBootStatus();
  const timestamp = new Date(status.lastBootTimestamp).toISOString().split('T')[0];
  
  // Count module statuses
  const totalModules = status.components.length;
  const passingModules = status.components.filter(c => c.status === 'success').length;
  const warningModules = status.components.filter(c => c.status === 'warning').length;
  const errorModules = status.components.filter(c => c.status === 'error').length;
  
  // Status emoji
  const statusEmoji = status.overallStatus === 'success' ? '✅' : 
                      status.overallStatus === 'warning' ? '⚠️' : '❌';
  
  // Generate badge color based on status
  const badgeColor = status.overallStatus === 'success' ? '#4ade80' : 
                     status.overallStatus === 'warning' ? '#fbbf24' : '#ef4444';
  
  // Generate HTML badge
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Status Badge</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
    .badge-container { 
      padding: 16px;
      border-radius: 8px;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      max-width: 500px;
      margin: 20px auto;
    }
    .badge-header {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 9999px;
      background-color: ${badgeColor};
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
    .badge-details {
      margin-top: 12px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .badge-detail {
      background-color: #f3f4f6;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .timestamp {
      font-size: 12px;
      color: #6b7280;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="badge-container">
    <div class="badge-header">
      <span>🩺 System Boot Status</span>
      <span class="badge-status">${statusEmoji} ${status.overallStatus === 'success' ? 'Operational' :
        status.overallStatus === 'warning' ? 'Degraded' : 'Critical'}</span>
    </div>
    <div class="badge-details">
      <span class="badge-detail">📦 Modules: ${totalModules}</span>
      <span class="badge-detail">✅ Passing: ${passingModules}</span>
      <span class="badge-detail">⚠️ Warning: ${warningModules}</span>
      <span class="badge-detail">❌ Failed: ${errorModules}</span>
    </div>
    <div class="timestamp">Last Check: ${timestamp}</div>
  </div>
</body>
</html>`;

  // Set Content-Type for HTML
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}