#!/bin/bash

echo "🚀 Starting AI Website with Docker..."
echo ""

# Git pull
git pull origin master

# Check env files
if [ ! -f "./.env" ]; then
    echo "❌ Missing frontend env file: ./.env"
    exit 1
fi

if [ ! -f "./agent/.env" ]; then
    echo "❌ Missing backend env file: ./agent/.env"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🎉 Starting services in detached mode..."
docker-compose up -d --force-recreate

echo ""
echo "✅ Deployment complete! Your site is running in the background."
echo "📝 To view logs, run: docker-compose logs -f"
