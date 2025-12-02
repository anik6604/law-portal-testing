#!/bin/bash
# EC2 Deployment Script for TAMU Law Portal
# Run this on the EC2 instance

set -e  # Exit on error

echo "===== Starting EC2 Setup ====="

# Update system
echo "Updating system packages..."
sudo dnf update -y

# Install Node.js 20
echo "Installing Node.js 20..."
sudo dnf install -y nodejs20 npm

# Install Git
echo "Installing Git..."
sudo dnf install -y git

# Install Nginx
echo "Installing Nginx..."
sudo dnf install -y nginx

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Create app directory
echo "Creating application directory..."
sudo mkdir -p /var/www/tamu-law-portal
sudo chown -R ec2-user:ec2-user /var/www/tamu-law-portal

# Clone repository
echo "Cloning repository..."
cd /var/www/tamu-law-portal
git clone https://github.com/FA25-CSCE482-capstone/github-setup-tamu-law.git .

# Install server dependencies
echo "Installing server dependencies..."
cd /var/www/tamu-law-portal/server
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd /var/www/tamu-law-portal/frontend
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Copy built frontend to web root
echo "Copying frontend build to web root..."
sudo mkdir -p /usr/share/nginx/html
sudo cp -r dist/* /usr/share/nginx/html/

echo "===== Setup Complete ====="
echo "Next steps:"
echo "1. Configure environment variables in /var/www/tamu-law-portal/server/.env"
echo "2. Configure Nginx"
echo "3. Start backend with PM2"
echo "4. Start Nginx"
