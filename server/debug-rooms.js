// Debug utility for viewing current rooms
// Run with: node debug-rooms.js

const http = require('http');

// Get all rooms from the server
http
  .get('http://localhost:3001/rooms', (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const rooms = JSON.parse(data);
        console.log('=== CURRENT ROOMS ===');

        if (rooms.length === 0) {
          console.log('No active rooms');
        } else {
          rooms.forEach((room) => {
            console.log(`\nRoom ID: ${room.id}`);
            console.log(`Name: ${room.name}`);
            console.log(`Game Type: ${room.gameType}`);
            console.log(`Players: ${room.playerCount}`);
            console.log(`Status: ${room.status}`);
            console.log('------------------------');
          });
        }
      } catch (e) {
        console.error('Error parsing room data:', e);
      }
    });
  })
  .on('error', (err) => {
    console.error('Error fetching rooms:', err.message);
  });
