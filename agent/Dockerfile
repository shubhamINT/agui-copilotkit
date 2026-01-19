# Python Backend Dockerfile
FROM python:3.12-slim

# Update and install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install uv 
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy only dependency files first (for better caching)
COPY pyproject.toml uv.lock ./

# Install dependencies into the system environment (no venv needed in Docker)
RUN uv sync --frozen --no-install-project

# Copy application code
COPY . .

# Final sync to install the project itself
RUN uv sync --frozen

# Expose port
EXPOSE 8123

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8123

# Start command
# We use 'uv run' to ensure we use the environment we just synced
CMD ["uv", "run", "langgraph", "dev", "--host", "0.0.0.0", "--port", "8123", "--no-browser"]