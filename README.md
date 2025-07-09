# Comment App

A minimalistic, scalable comment application with nested replies, real-time notifications, and modern dark UI.

## Features

- **Secure Authentication**: JWT-based user authentication
- **Nested Comments**: Support for deeply nested comment replies
- **Time-based Editing**: Comments editable within 15 minutes of posting
- **Soft Delete & Restore**: Delete and restore comments within 15-minute grace period
- **Real-time Notifications**: WebSocket-based notification system
- **Modern Dark UI**: Minimalistic, responsive design
- **Production Ready**: Fully Dockerized with PostgreSQL

## Tech Stack

- **Backend**: NestJS with TypeScript
- **Frontend**: Next.js with TypeScript
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **Styling**: Tailwind CSS
- **Deployment**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Production Deployment

1. Clone the repository:
```bash
git clone <repository-url>
cd comment-app
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Development

1. Start development environment:
```bash
docker-compose -f docker-compose.dev.yml up
```

2. Or run locally:

**Backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Architecture

### Backend Structure
```
backend/
├── src/
│   ├── auth/           # Authentication module
│   ├── users/          # User management
│   ├── comments/       # Comment system
│   ├── notifications/  # Notification system
│   └── entities/       # Database entities
```

### Frontend Structure
```
frontend/
├── app/                # Next.js app directory
├── components/         # React components
├── lib/
│   ├── contexts/       # React contexts
│   └── api.ts          # API client
```

## Key Features Implementation

### Time-based Operations
- Comments are editable for 15 minutes after creation
- Deleted comments can be restored within 15 minutes
- UTC timezone synchronization between frontend and backend

### Nested Comments
- Supports unlimited nesting levels
- Efficient recursive loading
- Visual indentation for reply hierarchy

### Real-time Notifications
- WebSocket connection for instant notifications
- Reply notifications with unread count
- Mark as read/unread functionality

### Security
- JWT authentication with secure cookies
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Comments
- `GET /comments` - Get paginated comments
- `POST /comments` - Create new comment
- `PUT /comments/:id` - Edit comment (within 15 min)
- `DELETE /comments/:id` - Delete comment
- `POST /comments/:id/restore` - Restore deleted comment

### Notifications
- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark notification as read
- `PUT /notifications/mark-all-read` - Mark all as read

## Database Schema

### Users
- id, username, email, password, timestamps

### Comments
- id, content, authorId, parentId, isEdited, isDeleted, timestamps
- Supports nested structure via parentId

### Notifications
- id, type, message, userId, commentId, triggeredByUserId, isRead, timestamps

## Environment Variables

### Backend
```
DATABASE_URL=postgresql://postgres:password@postgres:5432/commentapp
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
```

### Frontend
```
NEXT_PUBLIC_API_URL=http://backend:3001
NEXT_PUBLIC_WS_URL=http://backend:3001
```

## Performance Optimizations

- Database indexing on frequently queried columns
- Pagination for comments and notifications
- Connection pooling for database
- Efficient nested comment loading
- Image optimization and lazy loading
- Production-ready Docker builds

## Deployment

The application is fully containerized and production-ready:

1. **Multi-stage Docker builds** for optimized image sizes
2. **Health checks** for database connectivity
3. **Volume persistence** for PostgreSQL data
4. **Network isolation** with custom Docker network
5. **Environment-based configuration**

## License

MIT License
