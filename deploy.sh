#!/bin/bash

set -e

echo "Starting production deployment..."

echo "Installing production dependencies..."
npm install --omit=dev

echo "Installing vite for build..."
npm install vite --no-save

echo "Building client and server..."
npm run build

echo "Removing vite from node_modules..."
rm -rf node_modules/vite

echo "Starting application..."
npm start