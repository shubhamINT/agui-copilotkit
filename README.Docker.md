# Docker Deployment Guide

This guide explains how to run the AI Website using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- OpenAI API Key

## Quick Start

### 1. Set Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

### 2. Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8123

### 4. Stop the Services

```bash
# Stop services
docker-compose down

# Stop and remove volumes (will delete ChromaDB data)
docker-compose down -v
```

## Development vs Production

### Development Mode

The current `docker-compose.yml` is configured for development with:
- Volume mounts for hot-reloading
- Exposed ports
- Health checks

### Production Mode

For production deployment:

1. **Remove volume mounts** in `docker-compose.yml`:
```yaml
# Remove this line from backend service:
# - ./agent:/app
```

2. **Use production Next.js config**:
Ensure `next.config.ts` has:
```typescript
output: 'standalone'
```

3. **Set production environment variables**:
```bash
NODE_ENV=production
```

## Individual Service Management

### Build Backend Only
```bash
docker build -t ai-website-backend ./agent
docker run -p 8123:8123 --env-file agent/.env ai-website-backend
```

### Build Frontend Only
```bash
docker build -t ai-website-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://backend:8123 ai-website-frontend
```

## Deployment to Cloud Platforms

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway up
```

### Render
1. Create new Web Service
2. Connect GitHub repo
3. Select "Docker" as environment
4. Render will automatically detect `Dockerfile`

### AWS ECS / GCP Cloud Run / Azure Container Apps
1. Build images:
```bash
docker build -t your-registry/ai-website-backend:latest ./agent
docker build -t your-registry/ai-website-frontend:latest .
```

2. Push to container registry:
```bash
docker push your-registry/ai-website-backend:latest
docker push your-registry/ai-website-frontend:latest
```

3. Deploy using platform-specific tools

## Troubleshooting

### Backend won't start
- Check if `OPENAI_API_KEY` is set in `.env`
- Verify port 8123 is not in use: `lsof -i :8123`

### Frontend can't connect to backend
- Ensure `NEXT_PUBLIC_API_URL` points to correct backend URL
- For Docker Compose, use service name: `http://backend:8123`
- For local dev, use: `http://localhost:8123`

### ChromaDB data lost
- Ensure volume is mounted: `./agent/chroma_db:/app/chroma_db`
- Check volume exists: `docker volume ls`

### Build is slow
- Docker is rebuilding dependencies
- Use layer caching by not changing `package.json` or `pyproject.toml` frequently

## Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Check Service Health
```bash
# List running containers
docker-compose ps

# Execute commands in container
docker-compose exec backend python -c "print('Backend is running')"
docker-compose exec frontend node -v
```

## Advanced Configuration

### Custom Ports

Edit `docker-compose.yml`:
```yaml
ports:
  - "8124:8123"  # Map host port 8124 to container port 8123
```

### Add Redis / PostgreSQL

Add to `docker-compose.yml`:
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Production Checklist

- [ ] Remove development volume mounts
- [ ] Set `NODE_ENV=production`
- [ ] Enable health checks
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx/traefik)
- [ ] Set up logging and monitoring
- [ ] Configure backup for ChromaDB volume
- [ ] Set resource limits in docker-compose
- [ ] Enable Docker secrets for API keys
- [ ] Set up CI/CD pipeline

## Performance Optimization

### Multi-stage Builds (Already Implemented)
Both Dockerfiles use multi-stage builds to minimize image size.

### Image Sizes
- Backend: ~800MB (includes Playwright)
- Frontend: ~200MB (optimized Next.js)

### Resource Limits
Add to `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

**Need help?** Open an issue or contact support.
