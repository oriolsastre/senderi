#!/bin/bash

set -e

echo "Starting production deployment..."

echo "Installing production dependencies..."
npm install --omit=dev

echo "Installing vite..."
npm install vite

echo "Building client and server..."
npm run build

echo "Uninstalling vite..."
npm uninstall vite

echo "Starting application..."
npm start