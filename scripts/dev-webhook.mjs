/**
 * Start ngrok tunnel for webhook development
 * 
 * This script starts ngrok with the fixed domain pointing to localhost:3000
 * for QStash and other webhook callbacks during local development.
 */

import { spawn } from 'child_process';

const NGROK_DOMAIN = 'sheep-wanted-squirrel.ngrok-free.app';
const LOCAL_PORT = 3000;

console.log('🚀 Starting ngrok tunnel...\n');
console.log(`Domain: ${NGROK_DOMAIN}`);
console.log(`Target: http://localhost:${LOCAL_PORT}\n`);

// Start ngrok with the fixed domain
const ngrok = spawn('ngrok', [
  'http',
  LOCAL_PORT.toString(),
  '--domain',
  NGROK_DOMAIN,
], {
  stdio: 'inherit',
  shell: true,
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping ngrok tunnel...');
  ngrok.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Stopping ngrok tunnel...');
  ngrok.kill();
  process.exit(0);
});

// Handle ngrok process exit
ngrok.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ ngrok exited with code ${code}`);
    console.error('Make sure ngrok is installed: npm install -g ngrok');
    process.exit(1);
  }
});

ngrok.on('error', (error) => {
  console.error('\n❌ Failed to start ngrok:', error.message);
  console.error('Make sure ngrok is installed: npm install -g ngrok');
  process.exit(1);
});

console.log('✅ ngrok tunnel is running!');
console.log(`🌐 Webhook URL: https://${NGROK_DOMAIN}`);
console.log('\nPress Ctrl+C to stop the tunnel\n');
