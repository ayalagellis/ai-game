import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { GameRoom } from './game/GameRoom.js';
import { AIGuide } from './ai/AIGuide.js';
import pool, { initializeDatabase } from './config/database.js';

config();

console.log('Starting Escape the AI Lab server...');

const app = express();
app.use(cors());
app.use(express.json());

// Store active game rooms
const gameRooms = new Map<string, GameRoom>();
const aiGuide = new AIGuide(process.env.OPENAI_API_KEY || '');

// Sample puzzles data
const puzzles = [
  {
    id: 'memory-grid-1',
    type: 'memoryGrid' as const,
    difficulty: 'easy' as const,
    data: {
      size: 4,
      tiles: ['X', 'O', 'O', 'X', 'O', 'X', 'X', 'O', 'X', 'O', 'O', 'X', 'O', 'X', 'X', 'O'],
      pattern: 'alternating'
    },
    solution: {
      revealed: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    },
    hints: [
      'Look for patterns in the tiles',
      'Try clicking tiles in sequence',
      'The pattern repeats every 2 tiles'
    ]
  },
  {
    id: 'riddle-1',
    type: 'riddle' as const,
    difficulty: 'medium' as const,
    data: {
      question: 'I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?',
      options: ['Echo', 'Wind', 'Shadow', 'Sound']
    },
    solution: {
      answer: 'Echo'
    },
    hints: [
      'Think about what repeats sounds',
      'It bounces back what you say',
      'It has no physical form'
    ]
  },
  {
    id: 'code-match-1',
    type: 'codeMatch' as const,
    difficulty: 'hard' as const,
    data: {
      sequence: [1, 1, 2, 3, 5, 8, 13],
      pattern: 'fibonacci',
      nextNumbers: [21, 34, 55]
    },
    solution: {
      correctSequence: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
    },
    hints: [
      'Look at the relationship between consecutive numbers',
      'Each number is the sum of the two before it',
      'This is a famous mathematical sequence'
    ]
  }
];

const httpServer = http.createServer(app);
const io = new Server(httpServer, { 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST']
  } 
});

// API Routes
app.get('/api/rooms', (req, res) => {
  const rooms = Array.from(gameRooms.values()).map(room => ({
    id: room.getState().roomId,
    playerCount: room.getState().players.length,
    phase: room.getState().phase,
    maxPlayers: 4
  }));
  res.json(rooms);
});

app.post('/api/rooms', (req, res) => {
  const roomId = uuidv4();
  const room = new GameRoom(roomId);
  gameRooms.set(roomId, room);
  
  res.json({ 
    roomId, 
    message: 'Room created successfully' 
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('joinRoom', async ({ roomId, playerName }) => {
    try {
      const room = gameRooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const player = room.addPlayer({
        name: playerName,
        socketId: socket.id
      });

      socket.join(roomId);
      socket.emit('joinedRoom', { player, roomState: room.getState() });
      socket.to(roomId).emit('playerJoined', { player, roomState: room.getState() });

      // Generate welcome narration
      const narration = await aiGuide.generateNarration('player_joined', room.getState());
      io.to(roomId).emit('aiMessage', narration);

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('leaveRoom', ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (room) {
      const player = room.removePlayer(socket.id);
      socket.leave(roomId);
      socket.to(roomId).emit('playerLeft', { player, roomState: room.getState() });
    }
  });

  socket.on('setReady', ({ roomId, playerId, isReady }) => {
    const room = gameRooms.get(roomId);
    if (room) {
      room.setPlayerReady(playerId, isReady);
      io.to(roomId).emit('playerReady', { playerId, isReady, roomState: room.getState() });
    }
  });

  socket.on('startGame', async ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (!room) return;

    if (room.canStartGame()) {
      const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
      const started = room.startGame(randomPuzzle);
      
      if (started) {
        io.to(roomId).emit('gameStarted', { 
          puzzle: randomPuzzle, 
          roomState: room.getState() 
        });

        // Generate start narration
        const narration = await aiGuide.generateNarration('game_start', room.getState(), randomPuzzle);
        io.to(roomId).emit('aiMessage', narration);
      }
    }
  });

  socket.on('makeMove', async ({ roomId, playerId, move }) => {
    const room = gameRooms.get(roomId);
    if (!room) return;

    const result = room.makeMove(playerId, move);
    io.to(roomId).emit('moveResult', { 
      playerId, 
      result, 
      roomState: room.getState() 
    });

    // Check if game ended
    if (result.gameCompleted) {
      const narration = await aiGuide.generateNarration('puzzle_completed', room.getState(), room.getState().currentPuzzle);
      io.to(roomId).emit('aiMessage', narration);
    }
  });

  socket.on('requestHint', async ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (!room) return;

    const hintResult = room.requestHint();
    if (hintResult.success) {
      const aiResponse = await aiGuide.generateHint(room.getState(), room.getState().currentPuzzle);
      io.to(roomId).emit('hintReceived', { 
        hint: aiResponse.message, 
        hintsUsed: room.getState().hintsUsed,
        roomState: room.getState() 
      });
    } else {
      socket.emit('hintError', { message: hintResult.hint });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Find and remove player from all rooms
    for (const [roomId, room] of gameRooms.entries()) {
      const player = room.removePlayer(socket.id);
      if (player) {
        socket.to(roomId).emit('playerLeft', { player, roomState: room.getState() });
        break;
      }
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Try to initialize database, but don't fail if PostgreSQL is not available
    try {
      await initializeDatabase();
      console.log('✅ Database initialized');
    } catch (dbError) {
      console.log('⚠️  Database not available, running without persistence');
      console.log('   (PostgreSQL connection failed - game will work in memory only)');
    }
    
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Escape the AI Lab server running on port ${PORT}`);
      console.log(`🎮 Ready for players to escape the lab!`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
