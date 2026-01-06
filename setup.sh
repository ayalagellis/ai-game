#!/bin/bash

# Dynamic Storylines Setup Script
# This script sets up the entire project for development

set -e

echo "🎮 Setting up Dynamic Storylines..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm $(npm -v) detected"

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install server dependencies
print_status "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
print_status "Installing client dependencies..."
cd client
npm install
cd ..

# Create environment files
print_status "Creating environment files..."

# Server environment
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    print_warning "Created server/.env from template. Please configure your environment variables."
else
    print_status "server/.env already exists"
fi

# Client environment
if [ ! -f "client/.env" ]; then
    cp client/env.example client/.env
    print_warning "Created client/.env from template. Please configure your environment variables."
else
    print_status "client/.env already exists"
fi

# Create asset directories
print_status "Creating asset directories..."
mkdir -p client/src/assets/backgrounds
mkdir -p client/src/assets/sounds
mkdir -p client/src/assets/particles
mkdir -p client/src/assets/icons

# Set up database (if PostgreSQL is available)
if command -v psql &> /dev/null; then
    print_status "PostgreSQL detected. You can set up the database manually:"
    print_status "1. Create a database named 'dynamic_storylines'"
    print_status "2. Update server/.env with your database credentials"
    print_status "3. Run 'cd server && npm run db:migrate' to create tables"
else
    print_warning "PostgreSQL not detected. Please install PostgreSQL and set up the database manually."
fi

# Build the project
print_status "Building the project..."
npm run build

print_success "Setup completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Configure your environment variables in server/.env and client/.env"
echo "2. Set up your PostgreSQL database"
echo "3. Run 'npm run db:migrate' to create database tables"
echo "4. Run 'npm run dev' to start the development servers"
echo ""
print_status "Development servers will run on:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend: http://localhost:3000"
echo ""
print_status "For production deployment:"
echo "  - Run 'npm run build' to build both client and server"
echo "  - Configure your production environment variables"
echo "  - Set up your production database"
echo ""
print_success "Happy coding! 🚀"
