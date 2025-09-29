import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { MemoryGrid, Riddle, CodeMatch } from './components/PuzzleComponents';
import './App.css';

// Types
interface Player {
  id: string;
  name: string;
  score: number;
  socketId: string;
  isReady: boolean;
}

interface Puzzle {
  id: string;
  type: 'memoryGrid' | 'riddle' | 'codeMatch';
  difficulty: 'easy' | 'medium' | 'hard';
  data: any;
  solution: any;
  hints: string[];
}

interface GameState {
  roomId: string;
  players: Player[];
  currentPuzzle: Puzzle | null;
  phase: 'waiting' | 'playing' | 'completed' | 'failed';
  timeLeft: number;
  scores: Record<string, number>;
  puzzleProgress: any;
  hintsUsed: number;
  maxHints: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface AIMessage {
  type: 'hint' | 'narration' | 'encouragement' | 'warning';
  message: string;
  context?: string;
}

// Components
const LandingPage: React.FC<{ onJoinGame: (playerName: string) => void }> = ({ onJoinGame }) => {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onJoinGame(playerName.trim());
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1>🧪 Escape the AI Lab</h1>
        <p className="subtitle">A cooperative puzzle adventure guided by AI</p>
        <p className="description">
          Work together with other players to solve mysterious puzzles and escape the virtual lab. 
          An AI Guide will help you along the way with hints and narration.
        </p>
        
        <form onSubmit={handleSubmit} className="join-form">
          <input
            type="text"
            placeholder="Enter your nickname"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            required
          />
          <button type="submit">Enter the Lab</button>
        </form>
      </div>
    </div>
  );
};

const Lobby: React.FC<{ 
  rooms: any[]; 
  onCreateRoom: () => void; 
  onJoinRoom: (roomId: string) => void;
}> = ({ rooms, onCreateRoom, onJoinRoom }) => {
  return (
    <div className="lobby">
      <h2>🏛️ Lab Lobby</h2>
      <div className="lobby-actions">
        <button onClick={onCreateRoom} className="create-room-btn">
          Create New Lab Session
        </button>
      </div>
      
      <div className="rooms-list">
        <h3>Active Lab Sessions</h3>
        {rooms.length === 0 ? (
          <p className="no-rooms">No active sessions. Create one to start!</p>
        ) : (
          rooms.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-info">
                <span className="room-id">Session {room.id.slice(0, 8)}</span>
                <span className="player-count">{room.playerCount}/{room.maxPlayers} players</span>
                <span className={`room-status ${room.phase}`}>{room.phase}</span>
              </div>
              <button 
                onClick={() => onJoinRoom(room.id)}
                disabled={room.playerCount >= room.maxPlayers}
                className="join-room-btn"
              >
                Join Session
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const GameRoom: React.FC<{
  gameState: GameState;
  currentPlayer: Player;
  socket: Socket;
  onLeaveRoom: () => void;
}> = ({ gameState, currentPlayer, socket, onLeaveRoom }) => {
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ type: 'player' | 'ai'; message: string; sender?: string }>>([]);

  useEffect(() => {
    socket.on('aiMessage', (aiMessage: AIMessage) => {
      setChatMessages(prev => [...prev, { 
        type: 'ai', 
        message: aiMessage.message 
      }]);
    });

    socket.on('hintReceived', ({ hint }) => {
      setChatMessages(prev => [...prev, { 
        type: 'ai', 
        message: `💡 Hint: ${hint}` 
      }]);
    });

    return () => {
      socket.off('aiMessage');
      socket.off('hintReceived');
    };
  }, [socket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      setChatMessages(prev => [...prev, { 
        type: 'player', 
        message: chatMessage.trim(), 
        sender: currentPlayer.name 
      }]);
      setChatMessage('');
    }
  };

  const handleRequestHint = () => {
    socket.emit('requestHint', { roomId: gameState.roomId });
  };

  const handleSetReady = (isReady: boolean) => {
    socket.emit('setReady', { 
      roomId: gameState.roomId, 
      playerId: currentPlayer.id, 
      isReady 
    });
  };

  const handleStartGame = () => {
    socket.emit('startGame', { roomId: gameState.roomId });
  };

  const canStartGame = gameState.players.length >= 2 && 
                      gameState.players.every(p => p.isReady) &&
                      gameState.phase === 'waiting';

  return (
    <div className="game-room">
      <div className="game-header">
        <h2>🧪 Lab Session: {gameState.roomId.slice(0, 8)}</h2>
        <div className="game-info">
          <span className={`time-left ${gameState.timeLeft <= 30 ? 'warning' : ''}`}>⏱️ {gameState.timeLeft}s</span>
          <span className="hints-used">💡 {gameState.hintsUsed}/{gameState.maxHints}</span>
          <button onClick={onLeaveRoom} className="leave-btn">Leave Lab</button>
        </div>
      </div>

      <div className="game-content">
        <div className="players-panel">
          <h3>👥 Lab Team</h3>
          {gameState.players.map(player => (
            <div key={player.id} className={`player ${player.id === currentPlayer.id ? 'current' : ''}`}>
              <span className="player-name">{player.name}</span>
              <span className="player-score">{player.score} pts</span>
              <span className={`player-ready ${player.isReady ? 'ready' : 'not-ready'}`}>
                {player.isReady ? '✅' : '⏳'}
              </span>
            </div>
          ))}
        </div>

        <div className="main-game-area">
          {gameState.phase === 'waiting' && (
            <div className="waiting-room">
              <h3>Waiting for players...</h3>
              <p>Players ready: {gameState.players.filter(p => p.isReady).length}/{gameState.players.length}</p>
              <div className="ready-controls">
                <button 
                  onClick={() => handleSetReady(!currentPlayer.isReady)}
                  className={`ready-btn ${currentPlayer.isReady ? 'ready' : 'not-ready'}`}
                >
                  {currentPlayer.isReady ? '✅ Ready' : '⏳ Not Ready'}
                </button>
                {canStartGame && (
                  <button onClick={handleStartGame} className="start-game-btn">
                    🚀 Start Lab Session
                  </button>
                )}
              </div>
            </div>
          )}

          {gameState.phase === 'playing' && gameState.currentPuzzle && (
            <div className="puzzle-area">
              <h3>🧩 Current Puzzle</h3>
              <div className="puzzle-info">
                <span className="puzzle-type">{gameState.currentPuzzle.type}</span>
                <span className="puzzle-difficulty">{gameState.currentPuzzle.difficulty}</span>
              </div>
              
              <div className="puzzle-content">
                {gameState.currentPuzzle.type === 'memoryGrid' && (
                  <MemoryGrid 
                    puzzle={gameState.currentPuzzle}
                    onMove={(move) => socket.emit('makeMove', { 
                      roomId: gameState.roomId, 
                      playerId: currentPlayer.id, 
                      move 
                    })}
                    disabled={gameState.phase !== 'playing'}
                  />
                )}
                
                {gameState.currentPuzzle.type === 'riddle' && (
                  <Riddle 
                    puzzle={gameState.currentPuzzle}
                    onMove={(move) => socket.emit('makeMove', { 
                      roomId: gameState.roomId, 
                      playerId: currentPlayer.id, 
                      move 
                    })}
                    disabled={gameState.phase !== 'playing'}
                  />
                )}
                
                {gameState.currentPuzzle.type === 'codeMatch' && (
                  <CodeMatch 
                    puzzle={gameState.currentPuzzle}
                    onMove={(move) => socket.emit('makeMove', { 
                      roomId: gameState.roomId, 
                      playerId: currentPlayer.id, 
                      move 
                    })}
                    disabled={gameState.phase !== 'playing'}
                  />
                )}
                
                <button onClick={handleRequestHint} className="hint-btn">
                  💡 Request Hint ({gameState.hintsUsed}/{gameState.maxHints})
                </button>
              </div>
            </div>
          )}

          {gameState.phase === 'completed' && (
            <div className="game-completed">
              <h3>🎉 Lab Session Completed!</h3>
              <p>Congratulations! You've successfully escaped the AI lab.</p>
              <div className="final-scores">
                {gameState.players.map(player => (
                  <div key={player.id} className="final-score">
                    {player.name}: {player.score} points
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="chat-panel">
          <h3>💬 Lab Communications</h3>
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.type}`}>
                {msg.type === 'player' && <span className="sender">{msg.sender}:</span>}
                {msg.type === 'ai' && <span className="ai-label">🤖 AI Guide:</span>}
                <span className="message">{msg.message}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="chat-form">
            <input
              type="text"
              placeholder="Type a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<'landing' | 'lobby' | 'game'>('landing');

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('joinedRoom', ({ player, roomState }) => {
      setCurrentPlayer(player);
      setGameState(roomState);
      setCurrentView('game');
    });

    newSocket.on('playerJoined', ({ roomState }) => {
      setGameState(roomState);
    });

    newSocket.on('playerLeft', ({ roomState }) => {
      setGameState(roomState);
    });

    newSocket.on('playerReady', ({ roomState }) => {
      setGameState(roomState);
    });

    newSocket.on('gameStarted', ({ puzzle, roomState }) => {
      setGameState(roomState);
    });

    newSocket.on('moveResult', ({ roomState }) => {
      setGameState(roomState);
    });

    newSocket.on('hintReceived', ({ hint, roomState }) => {
      setGameState(roomState);
    });

    newSocket.on('error', ({ message }) => {
      alert(`Error: ${message}`);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoinGame = async (playerName: string) => {
    if (!socket) return;

    try {
      const response = await fetch('/api/rooms');
      const roomsData = await response.json();
      setRooms(roomsData);
      setCurrentView('lobby');
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      // Fallback: just show lobby even if fetch fails
      setRooms([]);
      setCurrentView('lobby');
    }
  };

  const handleCreateRoom = async () => {
    if (!socket) return;

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST'
      });
      const { roomId } = await response.json();
      
      // Join the newly created room
      socket.emit('joinRoom', { roomId, playerName: 'Player' });
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (!socket) return;
    socket.emit('joinRoom', { roomId, playerName: 'Player' });
  };

  const handleLeaveRoom = () => {
    if (!socket || !gameState) return;
    socket.emit('leaveRoom', { roomId: gameState.roomId });
    setCurrentView('lobby');
    setCurrentPlayer(null);
    setGameState(null);
  };

  return (
    <div className="App">
      {currentView === 'landing' && <LandingPage onJoinGame={handleJoinGame} />}
      {currentView === 'lobby' && (
        <Lobby 
          rooms={rooms} 
          onCreateRoom={handleCreateRoom} 
          onJoinRoom={handleJoinRoom} 
        />
      )}
      {currentView === 'game' && gameState && currentPlayer && socket && (
        <GameRoom 
          gameState={gameState}
          currentPlayer={currentPlayer}
          socket={socket}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
};

export default App;