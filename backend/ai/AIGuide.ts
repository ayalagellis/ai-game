import OpenAI from 'openai';
import { GameState, Puzzle } from '../game/GameRoom.js';


export interface AIResponse {
  type: 'hint' | 'narration' | 'encouragement' | 'warning';
  message: string;
  context?: string;
}

export class AIGuide {
  private openai: OpenAI;
  private conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt(): void {
    this.conversationHistory = [
      {
        role: 'system',
        content: `You are the AI Guide for "Escape the AI Lab", a cooperative puzzle game. Your role is to:

1. Provide helpful hints without giving away solutions
2. Narrate the story and create atmosphere
3. Encourage players and maintain engagement
4. Warn players about time limits or mistakes

Guidelines:
- Be encouraging and supportive
- Give hints that guide thinking, not answers
- Use a mysterious, scientific lab theme
- Keep responses concise (1-2 sentences)
- Adapt your tone to the situation (urgent for time pressure, calm for encouragement)
- Never directly reveal puzzle solutions

Game Context: Players are trapped in a virtual AI lab and must solve puzzles to escape.`
      }
    ];
  }

  async generateHint(gameState: GameState, puzzle: Puzzle | null): Promise<AIResponse> {
    const context = this.buildGameContext(gameState, puzzle);
    
    const prompt = `Current game state:
${context}

The players are asking for a hint. Provide a helpful hint that guides their thinking without revealing the solution. Consider:
- What they've tried so far
- How much time is left
- How many hints they've used
- The puzzle type and difficulty

Respond with just the hint message, keeping it mysterious and lab-themed.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...this.conversationHistory, { role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      });

      const hint = response.choices[0]?.message?.content || 'Keep exploring the patterns...';
      
      return {
        type: 'hint',
        message: hint,
        context: 'Players requested a hint'
      };
    } catch (error) {
      console.error('Error generating hint:', error);
      return {
        type: 'hint',
        message: 'The lab\'s systems are analyzing your progress... Try looking for patterns.',
        context: 'AI service error'
      };
    }
  }

  async generateNarration(event: string, gameState: GameState, puzzle?: Puzzle | null): Promise<AIResponse> {
    const context = puzzle ? this.buildGameContext(gameState, puzzle) : this.buildBasicContext(gameState);
    
    const prompt = `Game event: ${event}
${context}

Provide atmospheric narration for this moment. Examples:
- Game start: Welcome players to the lab
- Puzzle completion: Celebrate their success
- Time warning: Create urgency
- Game failure: Provide closure

Keep it mysterious, scientific, and engaging. 1-2 sentences max.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...this.conversationHistory, { role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.8
      });

      const narration = response.choices[0]?.message?.content || 'The lab awaits your next move...';
      
      return {
        type: 'narration',
        message: narration,
        context: event
      };
    } catch (error) {
      console.error('Error generating narration:', error);
      return {
        type: 'narration',
        message: 'The mysterious lab continues its silent observation...',
        context: 'AI service error'
      };
    }
  }

  async generateEncouragement(gameState: GameState, puzzle: Puzzle | null): Promise<AIResponse> {
    const context = this.buildGameContext(gameState, puzzle);
    
    const prompt = `Current game state:
${context}

The players seem to be struggling or taking too long. Provide encouraging words that:
- Boost their confidence
- Remind them of their progress
- Suggest they try a different approach
- Maintain the lab atmosphere

Keep it supportive and mysterious.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...this.conversationHistory, { role: 'user', content: prompt }],
        max_tokens: 120,
        temperature: 0.6
      });

      const encouragement = response.choices[0]?.message?.content || 'The lab believes in your potential...';
      
      return {
        type: 'encouragement',
        message: encouragement,
        context: 'Players need encouragement'
      };
    } catch (error) {
      console.error('Error generating encouragement:', error);
      return {
        type: 'encouragement',
        message: 'The lab\'s systems detect your determination...',
        context: 'AI service error'
      };
    }
  }

  async generateWarning(gameState: GameState, warningType: 'time' | 'mistake' | 'hint_limit'): Promise<AIResponse> {
    const context = this.buildBasicContext(gameState);
    
    const prompt = `Warning type: ${warningType}
${context}

Generate an urgent warning message that:
- Creates appropriate urgency
- Maintains the lab theme
- Provides guidance without panic
- Is concise but impactful

Examples:
- Time warning: Create urgency about lab shutdown
- Mistake warning: Suggest they reconsider their approach
- Hint limit: Warn about limited assistance`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...this.conversationHistory, { role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.5
      });

      const warning = response.choices[0]?.message?.content || 'The lab\'s systems detect an issue...';
      
      return {
        type: 'warning',
        message: warning,
        context: warningType
      };
    } catch (error) {
      console.error('Error generating warning:', error);
      return {
        type: 'warning',
        message: 'The lab\'s monitoring systems alert you...',
        context: 'AI service error'
      };
    }
  }

  private buildGameContext(gameState: GameState, puzzle: Puzzle | null): string {
    const players = gameState.players.map((p: any) => `${p.name} (${p.score} pts)`).join(', ');
    const progress = JSON.stringify(gameState.puzzleProgress, null, 2);
    
    if (!puzzle) {
      return `
Room: ${gameState.roomId}
Players: ${players}
Phase: ${gameState.phase}
Time Left: ${gameState.timeLeft}s
Hints Used: ${gameState.hintsUsed}/${gameState.maxHints}

No active puzzle`;
    }
    
    return `
Room: ${gameState.roomId}
Players: ${players}
Phase: ${gameState.phase}
Time Left: ${gameState.timeLeft}s
Hints Used: ${gameState.hintsUsed}/${gameState.maxHints}

Current Puzzle:
- Type: ${puzzle.type}
- Difficulty: ${puzzle.difficulty}
- Data: ${JSON.stringify(puzzle.data, null, 2)}
- Progress: ${progress}`;
  }

  private buildBasicContext(gameState: GameState): string {
    const players = gameState.players.map((p: any) => `${p.name} (${p.score} pts)`).join(', ');
    
    return `
Room: ${gameState.roomId}
Players: ${players}
Phase: ${gameState.phase}
Time Left: ${gameState.timeLeft}s
Hints Used: ${gameState.hintsUsed}/${gameState.maxHints}`;
  }

  // Model Context Protocol integration
  async processMCPRequest(request: any): Promise<AIResponse> {
    const { type, context, gameState, puzzle } = request;
    
    switch (type) {
      case 'hint':
        return await this.generateHint(gameState, puzzle);
      case 'narration':
        return await this.generateNarration(context.event, gameState, puzzle);
      case 'encouragement':
        return await this.generateEncouragement(gameState, puzzle);
      case 'warning':
        return await this.generateWarning(gameState, context.warningType);
      default:
        return {
          type: 'narration',
          message: 'The lab\'s systems are processing your request...',
          context: 'Unknown request type'
        };
    }
  }

  // Reset conversation history for new games
  resetConversation(): void {
    this.initializeSystemPrompt();
  }
}
