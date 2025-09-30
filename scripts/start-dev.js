#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🌱 Starting AgriAssist Development Server...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Warning: .env.local file not found!');
  console.log('📝 Please create .env.local and add your GEMINI_API_KEY\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  const install = spawn('npm', ['install'], { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '..'),
    shell: true 
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      startServer();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🚀 Starting Next.js development server...');
  console.log('📱 Mobile-optimized and ready for localhost testing\n');
  
  const server = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '..'),
    shell: true 
  });
  
  server.on('close', (code) => {
    console.log(`\n🛑 Server stopped with code ${code}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.kill('SIGINT');
    process.exit(0);
  });
}