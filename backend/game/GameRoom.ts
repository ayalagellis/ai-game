import { v4 as uuidv4 } from 'uuid';

export interface Player {
  id: string;
  name: string;
  score: number;
  socketId: string;
  isReady: boolean;
}

export interface Puzzle {
  id: string;
  type: 'memoryGrid' | 'riddle' | 'codeMatch';
  difficulty: 'easy' | 'medium' | 'hard';
  data: any;
  solution: any;
  hints: string[];
}

export interface GameState {
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

export class GameRoom {
  private state: GameState;
  private timer: NodeJS.Timeout | null = null;
  private puzzleTimeLimit: number;

  constructor(roomId: string, puzzleTimeLimit: number = 300) {
    this.puzzleTimeLimit = puzzleTimeLimit;
    this.state = {
      roomId,
      players: [],
      currentPuzzle: null,
      phase: 'waiting',
      timeLeft: puzzleTimeLimit,
      scores: {},
      puzzleProgress: {},
      hintsUsed: 0,
      maxHints: 3,
      createdAt: new Date()
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  addPlayer(player: Omit<Player, 'id' | 'score' | 'isReady'>): Player {
    const newPlayer: Player = {
      ...player,
      id: uuidv4(),
      score: 0,
      isReady: false
    };

    this.state.players.push(newPlayer);
    this.state.scores[newPlayer.id] = 0;
    return newPlayer;
  }

  removePlayer(socketId: string): Player | null {
    const playerIndex = this.state.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return null;

    const player = this.state.players[playerIndex];
    this.state.players.splice(playerIndex, 1);
    delete this.state.scores[player.id];

    // If no players left, reset room
    if (this.state.players.length === 0) {
      this.resetRoom();
    }

    return player;
  }

  setPlayerReady(playerId: string, isReady: boolean): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return false;

    player.isReady = isReady;
    return true;
  }

  canStartGame(): boolean {
    return this.state.players.length >= 2 && 
           this.state.players.every(p => p.isReady) &&
           this.state.phase === 'waiting';
  }

  startGame(puzzle: Puzzle): boolean {
    if (!this.canStartGame()) return false;

    this.state.phase = 'playing';
    this.state.currentPuzzle = puzzle;
    this.state.timeLeft = this.puzzleTimeLimit;
    this.state.startedAt = new Date();
    this.state.puzzleProgress = this.initializePuzzleProgress(puzzle);
    this.state.hintsUsed = 0;

    this.startTimer();
    return true;
  }

  private initializePuzzleProgress(puzzle: Puzzle): any {
    switch (puzzle.type) {
      case 'memoryGrid':
        return {
          revealed: [],
          attempts: 0,
          matches: 0
        };
      case 'riddle':
        return {
          attempts: 0,
          selectedAnswer: null
        };
      case 'codeMatch':
        return {
          currentSequence: [],
          attempts: 0
        };
      default:
        return {};
    }
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.state.timeLeft--;
      
      if (this.state.timeLeft <= 0) {
        this.endGame(false);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  makeMove(playerId: string, move: any): { success: boolean; message: string; gameCompleted?: boolean } {
    if (this.state.phase !== 'playing' || !this.state.currentPuzzle) {
      return { success: false, message: 'Game not in playing state' };
    }

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    const result = this.processMove(move);
    
    if (result.success) {
      // Award points for correct moves
      const points = this.calculatePoints(move);
      player.score += points;
      this.state.scores[playerId] = player.score;

      // Check if puzzle is completed
      if (result.gameCompleted) {
        this.endGame(true);
      }
    }

    return result;
  }

  private processMove(move: any): { success: boolean; message: string; gameCompleted?: boolean } {
    if (!this.state.currentPuzzle) {
      return { success: false, message: 'No active puzzle' };
    }

    switch (this.state.currentPuzzle.type) {
      case 'memoryGrid':
        return this.processMemoryGridMove(move);
      case 'riddle':
        return this.processRiddleMove(move);
      case 'codeMatch':
        return this.processCodeMatchMove(move);
      default:
        return { success: false, message: 'Unknown puzzle type' };
    }
  }

  private processMemoryGridMove(move: any): { success: boolean; message: string; gameCompleted?: boolean } {
    const { tileIndex } = move;
    const progress = this.state.puzzleProgress as any;
    
    if (progress.revealed.includes(tileIndex)) {
      return { success: false, message: 'Tile already revealed' };
    }

    progress.revealed.push(tileIndex);
    progress.attempts++;

    // Check if all tiles are revealed
    const totalTiles = this.state.currentPuzzle!.data.tiles.length;
    if (progress.revealed.length === totalTiles) {
      return { success: true, message: 'Puzzle completed!', gameCompleted: true };
    }

    return { success: true, message: 'Tile revealed' };
  }

  private processRiddleMove(move: any): { success: boolean; message: string; gameCompleted?: boolean } {
    const { answer } = move;
    const progress = this.state.puzzleProgress as any;
    
    progress.attempts++;
    progress.selectedAnswer = answer;

    if (answer === this.state.currentPuzzle!.solution.answer) {
      return { success: true, message: 'Correct answer!', gameCompleted: true };
    }

    return { success: false, message: 'Incorrect answer' };
  }

  private processCodeMatchMove(move: any): { success: boolean; message: string; gameCompleted?: boolean } {
    const { sequence } = move;
    const progress = this.state.puzzleProgress as any;
    
    progress.attempts++;
    progress.currentSequence = sequence;

    const correctSequence = this.state.currentPuzzle!.solution.correctSequence;
    if (JSON.stringify(sequence) === JSON.stringify(correctSequence)) {
      return { success: true, message: 'Correct sequence!', gameCompleted: true };
    }

    return { success: false, message: 'Incorrect sequence' };
  }

  private calculatePoints(move: any): number {
    // Base points for any correct move
    let points = 10;
    
    // Bonus points for speed
    const timeBonus = Math.max(0, this.state.timeLeft * 0.1);
    points += timeBonus;

    // Penalty for hints used
    const hintPenalty = this.state.hintsUsed * 5;
    points = Math.max(0, points - hintPenalty);

    return Math.round(points);
  }

  requestHint(): { success: boolean; hint: string } {
    if (this.state.phase !== 'playing' || !this.state.currentPuzzle) {
      return { success: false, hint: 'No active puzzle' };
    }

    if (this.state.hintsUsed >= this.state.maxHints) {
      return { success: false, hint: 'No hints remaining' };
    }

    this.state.hintsUsed++;
    const hintIndex = Math.min(this.state.hintsUsed - 1, this.state.currentPuzzle.hints.length - 1);
    const hint = this.state.currentPuzzle.hints[hintIndex] || 'Keep trying!';

    return { success: true, hint };
  }

  endGame(success: boolean): void {
    this.stopTimer();
    this.state.phase = success ? 'completed' : 'failed';
    this.state.completedAt = new Date();
  }

  resetRoom(): void {
    this.stopTimer();
    this.state.phase = 'waiting';
    this.state.currentPuzzle = null;
    this.state.timeLeft = this.puzzleTimeLimit;
    this.state.puzzleProgress = {};
    this.state.hintsUsed = 0;
    this.state.startedAt = undefined;
    this.state.completedAt = undefined;
  }

  destroy(): void {
    this.stopTimer();
  }
}
