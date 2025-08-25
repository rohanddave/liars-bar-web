# Liar's Bar Game

A full-stack application with a NestJS backend and Next.js frontend.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)

### Running with Docker (Recommended)

1. Clone the repository and navigate to the project directory:
```bash
cd liars-bar/game
```

2. Start all services:
```bash
docker-compose up --build
```

This will start:
- **Frontend**: http://localhost:3001 (Next.js)
- **Backend API**: http://localhost:3000 (NestJS)
- **Database**: PostgreSQL on port 5432
- **Redis**: Redis cache on port 6379

### Services

- **nextjs-app**: Next.js frontend application
- **nestjs-app**: NestJS backend API
- **db**: PostgreSQL database
- **redis**: Redis cache

### Stopping Services

```bash
docker-compose down
```

### Local Development

#### Backend (NestJS)
```bash
cd liars-bar-backend
npm install
npm run start:dev
```

#### Frontend (Next.js)
```bash
cd liars-bar-web-frontend
npm install
npm run dev
```

### Database Connection
- Host: localhost (or `db` from within containers)
- Port: 5432
- Database: oneprediction
- Username: postgres
- Password: oneprediction