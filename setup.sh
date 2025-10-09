#!/bin/bash

# TAMU Law Portal - Complete Setup Script

set -e

echo "TAMU Law Portal Setup"
echo "========================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

echo "Docker is running"
echo ""

# Start database
echo "Starting PostgreSQL database..."
docker-compose up -d

echo "Waiting for database to be healthy..."
sleep 5

# Check database health
if docker-compose exec -T db pg_isready -U tamu -d law_portal > /dev/null 2>&1; then
  echo "Database is healthy"
  break
fi

echo ""

# Setup server
if [ ! -f "server/.env" ]; then
  echo "Creating server/.env from example..."
  cp server/.env.example server/.env
fi

if [ ! -d "server/node_modules" ]; then
  echo "Installing server dependencies..."
  cd server
  npm install
  cd ..
else
  echo "Server dependencies already installed"
fi

echo ""

# Setup frontend
if [ ! -f "frontend/.env" ]; then
  echo "Creating frontend/.env from example..."
  cp frontend/.env.example frontend/.env
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd frontend
  npm install
  cd ..
else
  echo "Frontend dependencies already installed"
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the server:"
echo "   cd server && npm run dev"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Visit http://localhost:5173 in your browser"
echo ""
echo "To check database: http://localhost:4000/health"
echo ""
