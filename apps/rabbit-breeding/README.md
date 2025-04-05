# Rabbit Breeding Micro-App

A standalone application for managing rabbit breeding operations with focus on genetics, lineage tracking, and breeding performance.

## Features

- **Animal Management**: Track rabbits with detailed information including breed, lineage, and performance metrics.
- **Breeding Pair Selection**: Get intelligent suggestions for breeding pairs with genetic compatibility scoring.
- **Inbreeding Prevention**: Automatic detection of risky breeding pairs based on shared ancestry.
- **Breeding Events**: Schedule and track breeding events with expected and actual outcomes.
- **Performance Metrics**: Calculate key metrics like genetic compatibility, predicted litter size, and ROI.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
2. Set up environment variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/rabbit_breeding
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Run database migrations:
   ```
   npm run db:push
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Animals

- `GET /api/animals` - List all rabbits
- `GET /api/animals/:id` - Get a specific rabbit
- `POST /api/animals` - Create a new rabbit
- `PUT /api/animals/:id` - Update a rabbit
- `DELETE /api/animals/:id` - Delete a rabbit
- `GET /api/animals/:id/potential-mates` - Get potential breeding mates for a rabbit

### Breeding

- `POST /api/breeding/risk-check` - Check inbreeding risk between a pair
- `GET /api/breeding-events` - List all breeding events
- `GET /api/breeding-events/:id` - Get a specific breeding event
- `POST /api/breeding-events` - Create a new breeding event
- `PUT /api/breeding-events/:id` - Update a breeding event
- `DELETE /api/breeding-events/:id` - Delete a breeding event

## Development

This micro-app is part of the Nature Breed Farm management system but can be run independently for focused development.

### Project Structure

- `client/` - React frontend
- `server/` - Express API backend
- `shared/` - Shared types and schemas

## Purpose

This module was split out from the main application to facilitate:

1. Independent algorithm stabilization for breeding calculations
2. Focused testing of genetic lineage tracking
3. Specialized development without impacting the main farm management system