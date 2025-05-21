const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development - restrict in production
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000, // 60 seconds
});

// Store rooms and connections in memory
// In production, use a database like DynamoDB
const rooms = new Map();
const connections = new Map();

// Make these available globally for direct reset
global.rooms = rooms;
global.connections = connections;

// Helper function to get room data without circular references
function getRoomData(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  return {
    ...room,
    players: Array.from(room.players.values()),
  };
}

// Routes
app.get('/', (req, res) => {
  res.send('Drinks With Friends WebSocket Server');
});

app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([id, room]) => ({
    id,
    name: room.name,
    gameType: room.gameType,
    playerCount: room.players.size,
    status: room.status,
  }));

  res.json(roomList);
});

// Reset endpoint to clear all data (for testing purposes)
app.post('/reset', (req, res) => {
  console.log('\n===== RESETTING SERVER DATA =====');

  // Count current data
  const roomCount = rooms.size;
  const connectionCount = connections.size;

  // Clear data
  rooms.clear();
  connections.clear();

  console.log(`Cleared ${roomCount} rooms and ${connectionCount} connections`);
  console.log('===== SERVER RESET COMPLETE =====\n');

  res.json({
    success: true,
    message: `Server data reset. Cleared ${roomCount} rooms and ${connectionCount} connections.`,
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`\n===== SOCKET CONNECTED: ${socket.id} =====`);
  console.log(`User ID: ${socket.handshake.auth.userId}`);
  console.log(`Connection time: ${new Date().toLocaleTimeString()}`);
  console.log(`Active connections: ${connections.size + 1}`);
  console.log(`Active rooms: ${rooms.size}`);
  console.log('========================================\n');

  // Store connection
  connections.set(socket.id, {
    socketId: socket.id,
    userId: socket.handshake.auth.userId || `guest-${nanoid(6)}`,
    roomId: null,
  });

  // Create Room
  socket.on('createRoom', (data) => {
    console.log('\n----- CREATE ROOM EVENT -----');
    console.log('Data received:', data);

    const roomId = nanoid(6).toUpperCase();
    const userId = connections.get(socket.id).userId;
    console.log(`User ID: ${userId}, Room ID: ${roomId}`);

    const newRoom = {
      id: roomId,
      name: data.name,
      gameType: data.gameType,
      ownerId: userId,
      isPrivate: data.isPrivate || true,
      inviteCode: roomId, // Add invite code field
      players: new Map(),
      status: 'waiting',
      gameState: null,
      settings: data.settings || {
        momMode: false,
        maxPlayers: 8,
        allowSpectators: false,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add creator as first player
    newRoom.players.set(userId, {
      id: userId,
      name: data.userName || 'Player 1',
      isOwner: true,
      isReady: false,
      joinedAt: Date.now(),
      socketId: socket.id,
      avatar: data.avatar || {
        base: 'default',
        outfit: 'casual',
        drink: 'beer',
        accessory: 'none',
      },
    });

    // Store room
    rooms.set(roomId, newRoom);

    // Update connection
    connections.get(socket.id).roomId = roomId;

    // Join socket room
    socket.join(roomId);

    // Send room data back
    const roomData = getRoomData(roomId);
    console.log('Room data being sent:', roomData);
    socket.emit('roomCreated', roomData);
    console.log(`Room created: ${roomId} by ${userId}`);
    console.log('----- CREATE ROOM COMPLETED -----\n');
  });

  // Join Room
  socket.on('joinRoom', (data) => {
    console.log('\n----- JOIN ROOM EVENT -----');
    console.log('Data received:', data);

    const roomId = data.roomId;
    const room = rooms.get(roomId);
    const connection = connections.get(socket.id);
    const userId = connection.userId;

    console.log(`User ${userId} attempting to join room ${roomId}`);
    console.log(`Room exists: ${room ? 'Yes' : 'No'}`);

    if (!room) {
      console.log(`Room ${roomId} not found!`);
      socket.emit('error', { message: 'Room not found' });
      console.log('----- JOIN ROOM FAILED: Room not found -----\n');
      return;
    }

    // Room is already validated above - remove duplicate check

    if (room.players.size >= room.settings.maxPlayers) {
      console.log(
        `Room ${roomId} is full (${room.players.size}/${room.settings.maxPlayers})`
      );
      socket.emit('error', { message: 'Room is full' });
      console.log('----- JOIN ROOM FAILED: Room is full -----\n');
      return;
    }

    // Leave current room if in one
    if (connection.roomId && connection.roomId !== roomId) {
      handleLeaveRoom(socket, connection);
    }

    // Add player to room
    const playerExists = room.players.has(userId);
    console.log(
      `Player already exists in room: ${playerExists ? 'Yes' : 'No'}`
    );

    if (!playerExists) {
      console.log(`Adding new player ${userId} to room ${roomId}`);
      room.players.set(userId, {
        id: userId,
        name: data.userName || `Player ${room.players.size + 1}`,
        isOwner: false,
        isReady: false,
        joinedAt: Date.now(),
        socketId: socket.id,
        avatar: data.avatar || {
          base: 'default',
          outfit: 'casual',
          drink: 'beer',
          accessory: 'none',
        },
      });
    } else {
      // Update existing player (reconnection)
      console.log(`Updating existing player ${userId} in room ${roomId}`);
      const player = room.players.get(userId);
      player.socketId = socket.id;
    }

    // Update connection
    connection.roomId = roomId;
    console.log(`Updated connection for ${userId} to room ${roomId}`);

    // Join socket room
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // Notify room of new player
    if (!playerExists) {
      console.log(`Broadcasting playerJoined event for ${userId}`);
      io.to(roomId).emit('playerJoined', room.players.get(userId));
    }

    // Send room data to player
    const roomData = getRoomData(roomId);
    console.log('Room data being sent to player:', roomData);
    socket.emit('roomJoined', roomData);
    console.log(`Player ${userId} joined room ${roomId}`);
    console.log('----- JOIN ROOM COMPLETED -----\n');
  });

  // Leave Room
  socket.on('leaveRoom', (data) => {
    console.log('\n----- LEAVE ROOM EVENT -----');
    console.log('Data received:', data);

    const connection = connections.get(socket.id);
    if (connection && connection.roomId) {
      console.log(
        `User ${connection.userId} leaving room ${connection.roomId}`
      );
      handleLeaveRoom(socket, connection);
      console.log('----- LEAVE ROOM COMPLETED -----\n');
    } else {
      console.log(`User not in a room, cannot leave`);
      console.log('----- LEAVE ROOM FAILED: Not in a room -----\n');
    }
  });

  // Start Game
  socket.on('startGame', (data) => {
    const roomId = data.roomId;
    const room = rooms.get(roomId);
    const connection = connections.get(socket.id);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.ownerId !== connection.userId) {
      socket.emit('error', {
        message: 'Only the room owner can start the game',
      });
      return;
    }

    if (room.players.size < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    // Initialize game state based on game type
    let gameState = {
      round: 1,
      phase: 'starting',
      currentPlayer: null,
      data: {},
    };

    // Game-specific initialization
    switch (room.gameType) {
      case 'kings-cup':
        gameState.data = initializeKingsCup();
        break;
      case 'never-have-i-ever':
        gameState.data = initializeNeverHaveIEver();
        break;
      case 'liars-dice':
        gameState.data = initializeLiarsDice(room.players.size);
        break;
      default:
        socket.emit('error', { message: 'Invalid game type' });
        return;
    }

    // Pick random first player
    const playerIds = Array.from(room.players.keys());
    gameState.currentPlayer =
      playerIds[Math.floor(Math.random() * playerIds.length)];

    // Update room
    room.status = 'playing';
    room.gameState = gameState;
    room.updatedAt = Date.now();

    // Notify all players in room
    io.to(roomId).emit('gameStateUpdate', gameState);
    console.log(`Game started in room ${roomId}`);
  });

  // Game Action
  socket.on('gameAction', (data) => {
    const { roomId, action, actionData } = data;
    const room = rooms.get(roomId);
    const connection = connections.get(socket.id);
    const userId = connection.userId;

    if (!room || room.status !== 'playing') {
      socket.emit('error', { message: 'Game not active' });
      return;
    }

    if (room.gameState.currentPlayer !== userId) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    // Process game action based on game type
    let newState;

    switch (room.gameType) {
      case 'kings-cup':
        newState = processKingsCupAction(
          room.gameState,
          action,
          actionData,
          userId
        );
        break;
      case 'never-have-i-ever':
        newState = processNeverHaveIEverAction(
          room.gameState,
          action,
          actionData,
          userId
        );
        break;
      case 'liars-dice':
        newState = processLiarsDiceAction(
          room.gameState,
          action,
          actionData,
          userId
        );
        break;
      default:
        socket.emit('error', { message: 'Invalid game type' });
        return;
    }

    // Update room state
    room.gameState = newState;
    room.updatedAt = Date.now();

    // Check for game end
    if (newState.phase === 'game_over') {
      room.status = 'finished';
    }

    // Broadcast new state to all players
    io.to(roomId).emit('gameStateUpdate', newState);

    // Broadcast game action to all players
    io.to(roomId).emit('gameAction', {
      playerId: userId,
      playerName: room.players.get(userId).name,
      action,
      actionData,
      description: getActionDescription(
        room.gameType,
        action,
        actionData,
        room
      ),
    });

    console.log(`Game action in room ${roomId}: ${action}`);
  });

  // Disconnection
  socket.on('disconnect', () => {
    const connection = connections.get(socket.id);
    console.log(`Socket disconnected: ${socket.id}`);

    if (connection) {
      // Handle room departure if in a room
      if (connection.roomId) {
        handleLeaveRoom(socket, connection, true);
      }

      // Remove connection
      connections.delete(socket.id);
    }
  });
});

// Helper function to handle leaving a room
function handleLeaveRoom(socket, connection, isDisconnect = false) {
  console.log('\n----- HANDLING LEAVE ROOM -----');
  const roomId = connection.roomId;
  const userId = connection.userId;
  const room = rooms.get(roomId);

  if (!room) {
    console.log(`Room ${roomId} not found, cannot leave`);
    console.log('----- LEAVE ROOM HANDLER FAILED -----\n');
    return;
  }

  console.log(`Processing leave room for user ${userId} from room ${roomId}`);

  // Get player
  const player = room.players.get(userId);
  if (!player) {
    console.log(`Player ${userId} not found in room ${roomId}`);
    console.log('----- LEAVE ROOM HANDLER FAILED -----\n');
    return;
  }

  console.log(`Found player ${userId} in room ${roomId}`);

  // If player is owner and other players exist, transfer ownership
  let playerName = player.name;
  let shouldDeleteRoom = false;

  // Remove player from room
  room.players.delete(userId);
  room.updatedAt = Date.now();
  console.log(`Removed player ${userId} from room ${roomId}`);
  console.log(`Room now has ${room.players.size} player(s)`);

  // Clear room connection
  if (!isDisconnect) {
    connection.roomId = null;
    socket.leave(roomId);
    console.log(
      `Cleared room connection for user ${userId} and left socket room`
    );
  } else {
    console.log(`Disconnect event - socket already removed`);
  }

  // Transfer ownership if owner leaves and others remain
  if (room.ownerId === userId && room.players.size > 0) {
    const newOwner = room.players.values().next().value;
    room.ownerId = newOwner.id;
    newOwner.isOwner = true;
    console.log(`Ownership transferred to ${newOwner.id} in room ${roomId}`);
  }
  // Delete room if empty
  else if (room.players.size === 0) {
    shouldDeleteRoom = true;
    console.log(`Room ${roomId} is now empty, marked for deletion`);
  }

  // Notify room of player leaving
  console.log(`Broadcasting playerLeft event for ${userId} (${playerName})`);
  io.to(roomId).emit('playerLeft', {
    playerId: userId,
    playerName,
  });

  // Delete room if empty
  if (shouldDeleteRoom) {
    rooms.delete(roomId);
    console.log(`Room deleted: ${roomId}`);
  }

  console.log(`Player ${userId} left room ${roomId}`);
  console.log('----- LEAVE ROOM HANDLER COMPLETED -----\n');
}

// Game initialization functions
function initializeKingsCup() {
  // Create a shuffled deck of cards
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = [
    'ace',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'jack',
    'queen',
    'king',
  ];

  let deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }

  // Shuffle deck
  deck = shuffleArray(deck);

  return {
    deck,
    drawnCards: [],
    currentCard: null,
    kingCount: 0,
    kingsCup: [],
  };
}

function initializeNeverHaveIEver() {
  // Sample questions for the game
  const questions = [
    'Never have I ever been skydiving',
    'Never have I ever eaten a bug on purpose',
    'Never have I ever lied to get out of a party',
    'Never have I ever cheated on a test',
    'Never have I ever been kicked out of a bar',
    'Never have I ever gone skinny dipping',
    'Never have I ever broken a bone',
    'Never have I ever gotten a tattoo',
    'Never have I ever been on TV',
    'Never have I ever gone surfing',
    'Never have I ever been to a concert alone',
    'Never have I ever played a drinking game',
    'Never have I ever cried during a movie',
    'Never have I ever ghosted someone',
    'Never have I ever had a crush on a teacher',
    'Never have I ever sent a text to the wrong person',
    'Never have I ever stolen something',
    'Never have I ever been on a blind date',
    'Never have I ever stayed up for more than 24 hours',
    'Never have I ever lied in this game',
  ];

  // Shuffle questions
  return {
    questions: shuffleArray(questions),
    currentQuestion: null,
    usedQuestions: [],
    playerScores: {},
    customQuestions: [],
  };
}

function initializeLiarsDice(_playerCount) {
  // Create initial dice for all players
  const playerDice = {};
  const playerDiceCount = {};

  // 5 dice per player to start
  return {
    round: 1,
    playerDice,
    playerDiceCount,
    currentBid: null,
    bidHistory: [],
    lastRoundLoser: null,
    dicePerPlayer: 5,
  };
}

// Process game actions
function processKingsCupAction(gameState, action, actionData, playerId) {
  const newState = { ...gameState };

  switch (action) {
    case 'drawCard':
      if (newState.deck.length === 0) {
        return {
          ...newState,
          phase: 'game_over',
          winner: playerId,
        };
      }

      // Draw card
      const card = newState.deck.pop();
      newState.currentCard = card;
      newState.drawnCards.push(card);

      // Check for kings
      if (card.value === 'king') {
        newState.kingCount++;

        if (newState.kingCount === 4) {
          return {
            ...newState,
            phase: 'game_over',
            loser: playerId,
          };
        }
      }

      // Set next player
      nextPlayer(newState);
      break;

    default:
      // Invalid action
      break;
  }

  return newState;
}

function processNeverHaveIEverAction(gameState, action, actionData, playerId) {
  const newState = { ...gameState };

  switch (action) {
    case 'nextQuestion':
      if (newState.questions.length === 0) {
        return {
          ...newState,
          phase: 'game_over',
        };
      }

      // Get next question
      const question = newState.questions.pop();
      newState.currentQuestion = question;
      newState.usedQuestions.push(question);

      // Set next player
      nextPlayer(newState);
      break;

    case 'answer':
      // Record player answer
      if (!newState.playerScores[playerId]) {
        newState.playerScores[playerId] = 0;
      }

      if (actionData.answer === true) {
        newState.playerScores[playerId]++;
      }

      break;

    case 'addCustomQuestion':
      newState.customQuestions.push(actionData.question);
      newState.questions.push(actionData.question);
      newState.questions = shuffleArray(newState.questions);
      break;

    default:
      // Invalid action
      break;
  }

  return newState;
}

function processLiarsDiceAction(gameState, action, actionData, playerId) {
  const newState = { ...gameState };

  switch (action) {
    case 'rollDice':
      // Roll dice for this player
      if (!newState.playerDice[playerId]) {
        const diceCount = newState.dicePerPlayer;
        newState.playerDice[playerId] = Array(diceCount)
          .fill(0)
          .map(() => rollDie());
        newState.playerDiceCount[playerId] = diceCount;
      }

      // Check if all players have rolled
      const allRolled = true; // This would check all connected players

      if (allRolled) {
        newState.phase = 'bidding';
      }

      break;

    case 'placeBid':
      // { quantity: 3, value: 4 }
      newState.currentBid = {
        quantity: actionData.quantity,
        value: actionData.value,
        playerId,
      };

      newState.bidHistory.push({
        ...newState.currentBid,
        timestamp: Date.now(),
      });

      // Set next player
      nextPlayer(newState);
      break;

    case 'challenge':
      // Check if the bid is valid
      const { quantity, value } = newState.currentBid;
      let totalDiceWithValue = 0;

      // Count all dice with the bid value
      Object.values(newState.playerDice).forEach((dice) => {
        dice.forEach((die) => {
          if (die === value) totalDiceWithValue++;
        });
      });

      // Determine if challenge succeeded
      const challengeSucceeded = totalDiceWithValue < quantity;

      // Handle player losing a die
      const losingPlayerId = challengeSucceeded
        ? newState.currentBid.playerId
        : playerId;
      newState.playerDiceCount[losingPlayerId]--;

      // Remove a die from the loser
      if (newState.playerDiceCount[losingPlayerId] <= 0) {
        // Player is out
        delete newState.playerDice[losingPlayerId];
        delete newState.playerDiceCount[losingPlayerId];
      } else {
        // Remove one die
        newState.playerDice[losingPlayerId].pop();
      }

      // Check if the game is over (only one player with dice)
      const playersWithDice = Object.keys(newState.playerDiceCount).length;

      if (playersWithDice <= 1) {
        // Game over - the remaining player wins
        const winner = Object.keys(newState.playerDiceCount)[0];
        newState.phase = 'game_over';
        newState.winner = winner;
      } else {
        // Start new round
        newState.round++;
        newState.phase = 'rolling';
        newState.currentBid = null;
        newState.playerDice = {};
        newState.lastRoundLoser = losingPlayerId;

        // Next player is the loser of this round
        newState.currentPlayer = losingPlayerId;
      }

      break;

    default:
      // Invalid action
      break;
  }

  return newState;
}

// Helper to get a human-readable description of a game action
function getActionDescription(gameType, action, actionData, room) {
  const player = room.players.get(room.gameState.currentPlayer);
  const playerName = player ? player.name : 'Unknown player';

  switch (gameType) {
    case 'kings-cup':
      if (action === 'drawCard') {
        const card = room.gameState.currentCard;
        return `${playerName} drew the ${card.value} of ${card.suit}`;
      }
      break;

    case 'never-have-i-ever':
      if (action === 'nextQuestion') {
        return `${playerName} asked: ${room.gameState.currentQuestion}`;
      } else if (action === 'answer') {
        return actionData.answer
          ? `${playerName} has done this!`
          : `${playerName} has never done this`;
      }
      break;

    case 'liars-dice':
      if (action === 'placeBid') {
        return `${playerName} bid ${actionData.quantity} ${actionData.value}'s`;
      } else if (action === 'challenge') {
        return `${playerName} challenged the last bid!`;
      }
      break;
  }

  return `${playerName} performed ${action}`;
}

// Helper to pick the next player in turn
function nextPlayer(_gameState) {
  // This would use the room's player list to determine the next player
  // For now, just keep the same player
}

// Helper to roll a single die
function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

// Helper to shuffle an array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
