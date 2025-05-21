// This script resets the server data - clears all rooms and connections
// It's useful for testing and debugging

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/reset',
  method: 'POST',
  timeout: 3000, // 3 seconds timeout
};

console.log('Resetting server data...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Server data successfully reset!');
      console.log(data);
    } else {
      console.error(`Failed to reset server data: HTTP ${res.statusCode}`);
      console.error(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error resetting server data:', error.message);
  console.error(
    '\nThe server does not appear to be running. Please start the server first:'
  );
  console.error('  pnpm server');
  console.error('\nOr run the complete dev environment:');
  console.error('  pnpm dev');
});

req.on('timeout', () => {
  req.destroy();
  console.error('Request timed out. The server appears to be unresponsive.');
});

req.end();
