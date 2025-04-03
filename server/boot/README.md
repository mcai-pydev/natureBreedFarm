# Smart Boot System for Nature Breed Farm

The Smart Boot System is a diagnostic and health monitoring tool for the Nature Breed Farm application. It provides automated checks for critical system components, helps with troubleshooting, and ensures reliable application startup.

## Features

- **Component Health Checks:** Verify database connectivity, API endpoints, and module status
- **Real-time Status Reporting:** Detailed diagnostic information for each component
- **CLI Interface:** Easy-to-use command-line tools for system monitoring
- **Visual Status Indicators:** Clear visual representation of system health
- **Automatic Recovery:** Guidance for resolving detected issues

## Usage

### Check System Status

```bash
# Run the system boot checks
npx tsx server/boot/cli.ts

# View current system status (without running new checks)
npx tsx server/boot/cli.ts status

# Reset the boot status file
npx tsx server/boot/cli.ts reset
```

## API Endpoints

The boot system exposes several endpoints for monitoring:

- `GET /api/health` - Summary of system health status
- `GET /api/system/status` - Detailed system boot status

## Component Status Definitions

- **success** - Component is functioning normally
- **warning** - Component has issues but is operational
- **error** - Component is not functioning correctly
- **pending** - Component status is being determined

## Architecture

The Smart Boot System is modular and consists of several components:

- **Core Module** (`index.ts`) - Main orchestration and status tracking
- **CLI Tool** (`cli.ts`) - Command-line interface for system interaction
- **Database Check** - Verifies database connectivity
- **API Endpoint Check** - Tests all critical API endpoints
- **Module Validation** - Component-specific functionality checks

## Status File

The system maintains a status file (`boot-status.json`) that contains:

- Status of all checked components
- Timestamp of the last boot
- Overall system status
- Environment information

## Troubleshooting

If the boot system reports errors:

1. Check the database connection configuration
2. Verify API endpoint functionality
3. Restart the application to trigger a fresh boot check
4. Review detailed component status for specific error messages

## Development

When adding new application features, ensure they have appropriate health checks by:

1. Adding verification logic to the appropriate check module
2. Exposing status via the health API endpoint
3. Testing both success and failure paths