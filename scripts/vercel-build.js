#!/usr/bin/env node

/**
 * Custom Vercel build script to assist with deployment
 * This script ensures the package.json is properly located
 * and runs any necessary pre-build steps
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log the current working directory and files
console.log('Current working directory:', process.cwd());
console.log('Files in directory:', fs.readdirSync('.'));

// Check if package.json exists
if (!fs.existsSync('./package.json')) {
  console.error('Error: package.json not found in current directory!');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
console.log('Found package.json with name:', packageJson.name);

// Verify dependencies
console.log('Verifying dependencies...');
if (!packageJson.dependencies.next) {
  console.error('Error: Next.js dependency not found in package.json!');
  process.exit(1);
}

// Check for next.config.js or next.config.mjs
const hasNextConfig = fs.existsSync('./next.config.js') || fs.existsSync('./next.config.mjs');
if (!hasNextConfig) {
  console.error('Warning: No Next.js config file found. This might cause deployment issues.');
}

// Check if node_modules exists
if (!fs.existsSync('./node_modules')) {
  console.log('Installing dependencies...');
  try {
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error installing dependencies:', error);
    process.exit(1);
  }
}

// Prepare for build
console.log('Preparing for build...');

// Run the regular build command
console.log('Starting Next.js build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

console.log('Vercel build script completed successfully!'); 