# Drinks With Friends WebSocket Server

A simple WebSocket server for the Drinks With Friends mobile app.

## Features

- Real-time WebSocket communication with Socket.IO
- Room management (create, join, leave)
- Player synchronization
- Game state management
- Support for multiple game types:
  - King's Cup
  - Never Have I Ever
  - Liar's Dice

## Installation

```bash
cd server
npm install
```

## Running the Server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will run on port 3001 by default. You can change this by setting the `PORT` environment variable.

## API Routes

- `GET /` - Server status check
- `GET /rooms` - List all active rooms

## WebSocket Events

### Client to Server

- `createRoom` - Create a new game room
- `joinRoom` - Join an existing game room
- `leaveRoom` - Leave the current game room
- `startGame` - Start a game in the current room
- `gameAction` - Perform a game action

### Server to Client

- `roomCreated` - Room successfully created
- `roomJoined` - Successfully joined a room
- `playerJoined` - A new player joined the room
- `playerLeft` - A player left the room
- `gameStateUpdate` - Updated game state
- `gameAction` - Game action performed by a player
- `error` - Error message

## Deployment

For production, deploy this server to:

- AWS EC2 instance
- Heroku
- AWS Elastic Beanstalk

For serverless deployment, convert to:

- AWS API Gateway WebSockets + Lambda Functions
