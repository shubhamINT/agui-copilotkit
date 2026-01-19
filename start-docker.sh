#!/bin/bash

echo "🚀 Starting AI Website with Docker..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env and add your OPENAI_API_KEY"
    echo ""
    read -p "Press Enter after you've added your API key..."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🎉 Starting services..."
docker-compose up

# Cleanup on exit
trap "docker-compose down" EXIT
