# Comment App

A full stack comment platform featuring secure authentication, nested comments, real time notifications, and a modern UI. The application is fully containerized using Docker and designed for production deployment.

## Features

- JWT based authentication
- Nested comments with unlimited depth
- Real time notifications via WebSockets
- Time limited editing and soft delete/restore
- Responsive dark themed UI
- Rate limiting and input validation
- Fully Dockerized (backend, frontend, database)

## Tech Stack

- Backend: NestJS (TypeScript)
- Frontend: Next.js (TypeScript, Tailwind CSS)
- Database: PostgreSQL
- Real-time: Socket.IO
- Deployment: Docker, Render

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Production Deployment
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd comment-app
   ```
2. Start all services:
   ```bash
   docker-compose up -d
   ```
3. Access the app:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Development
- For hot reload:
  ```bash
  docker-compose -f docker-compose.dev.yml up
  ```
- Or run services locally (see backend/frontend README for details)

## Architecture

- **backend/**: NestJS API (auth, users, comments, notifications)
- **frontend/**: Next.js app (React components, API client, contexts)
- **docker-compose.yml**: Multi-container orchestration

## API Overview

- `POST /auth/register` — Register user
- `POST /auth/login` — Login
- `GET /comments` — List comments (paginated, nested)
- `POST /comments` — Create comment
- `PUT /comments/:id` — Edit comment (15 min window)
- `DELETE /comments/:id` — Soft delete
- `POST /comments/:id/restore` — Restore (15 min window)
- `GET /notifications` — List notifications
- `PUT /notifications/:id/read` — Mark as read

## Database Schema

- **User**: id, username, email, password, timestamps
- **Comment**: id, content, authorId, parentId, isEdited, isDeleted, timestamps
- **Notification**: id, type, message, userId, commentId, triggeredByUserId, isRead, timestamps

## Environment Variables

See `.env.production.template` for required variables.

## Deployment Notes

- Multi-stage Docker builds for optimized images
- Health checks and persistent volumes for PostgreSQL
- CORS and WebSocket CORS configured for cloud deployment
- Suitable for Render, Railway, or any Docker host

