# Deployment Guide for Nature Breed Farm

## Project Type
This is a **Node.js/TypeScript** application, not a Python application. Even though there are Python dependencies listed in the requirements.txt file, the core application runs on Node.js.

## Deployment Steps

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database (connection details provided through environment variables)
- Optional: Python 3.11+ (only if using AI assistant features)

### Environment Variables
Ensure these environment variables are set:
```
DATABASE_URL=postgresql://username:password@hostname:port/database
OPENAI_API_KEY=your-openai-api-key (only if using AI features)
```

### Build Process
1. Install Node.js dependencies:
   ```
   npm install
   ```

2. Build the application:
   ```
   npm run build
   ```

3. If Python components are needed:
   ```
   pip install -r requirements.txt.new
   ```

### Start the Application
```
npm start
```

This will run the application in production mode using the built files.

## Common Deployment Issues

### Issue 1: Using wrong build command
If deployment is failing, ensure you're using the correct build command for a Node.js application:
```
npm run build
```
Instead of Python build commands.

### Issue 2: Incorrect requirements.txt
The original requirements.txt file contained references to local file paths that won't work in deployment. If Python components are needed, use requirements.txt.new instead, which contains only the necessary dependencies.

### Issue 3: Database connection
Ensure the PostgreSQL database is accessible from the deployment environment and that the DATABASE_URL environment variable is correctly set.

## Project Structure
- `/client` - Frontend React/TypeScript code
- `/server` - Backend Express.js code
- `/shared` - Shared types and schemas
- `/dist` - Built application (created during build process)

## Technical Contacts
For deployment issues, contact the development team.# Deployment Guide for Nature Breed Farm
