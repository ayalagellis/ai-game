import React, { useState, useEffect } from 'react';

interface MemoryGridProps {
  puzzle: any;
  onMove: (move: any) => void;
  disabled?: boolean;
}

export const MemoryGrid: React.FC<MemoryGridProps> = ({ puzzle, onMove, disabled = false }) => {
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);

  useEffect(() => {
    // Reset when puzzle changes
    setRevealedTiles([]);
    setSelectedTiles([]);
  }, [puzzle.id]);

  const handleTileClick = (index: number) => {
    if (disabled || revealedTiles.includes(index) || selectedTiles.includes(index)) {
      return;
    }

    const newSelected = [...selectedTiles, index];
    setSelectedTiles(newSelected);

    // Make move
    onMove({ tileIndex: index });

    // Auto-reveal after a short delay for visual feedback
    setTimeout(() => {
      setRevealedTiles(prev => [...prev, index]);
      setSelectedTiles([]);
    }, 300);
  };

  const getTileContent = (index: number) => {
    if (revealedTiles.includes(index)) {
      return puzzle.data.tiles[index];
    }
    if (selectedTiles.includes(index)) {
      return puzzle.data.tiles[index];
    }
    return '?';
  };

  const getTileClass = (index: number) => {
    let baseClass = 'memory-tile';
    if (revealedTiles.includes(index)) {
      baseClass += ' revealed';
    } else if (selectedTiles.includes(index)) {
      baseClass += ' selected';
    }
    return baseClass;
  };

  return (
    <div className="memory-grid">
      <h4>Memory Grid Puzzle</h4>
      <p>Click tiles to reveal the pattern. Work together to solve it!</p>
      <div className="grid-container" style={{ 
        gridTemplateColumns: `repeat(${Math.sqrt(puzzle.data.tiles.length)}, 1fr)` 
      }}>
        {puzzle.data.tiles.map((tile: string, index: number) => (
          <button
            key={index}
            className={getTileClass(index)}
            onClick={() => handleTileClick(index)}
            disabled={disabled}
          >
            {getTileContent(index)}
          </button>
        ))}
      </div>
    </div>
  );
};

interface RiddleProps {
  puzzle: any;
  onMove: (move: any) => void;
  disabled?: boolean;
}

export const Riddle: React.FC<RiddleProps> = ({ puzzle, onMove, disabled = false }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  const handleAnswerSelect = (answer: string) => {
    if (disabled) return;
    
    setSelectedAnswer(answer);
    onMove({ answer });
  };

  return (
    <div className="riddle-puzzle">
      <h4>Riddle Puzzle</h4>
      <div className="riddle-question">
        <p>{puzzle.data.question}</p>
      </div>
      <div className="riddle-options">
        {puzzle.data.options.map((option: string, index: number) => (
          <button
            key={index}
            className={`riddle-option ${selectedAnswer === option ? 'selected' : ''}`}
            onClick={() => handleAnswerSelect(option)}
            disabled={disabled}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

interface CodeMatchProps {
  puzzle: any;
  onMove: (move: any) => void;
  disabled?: boolean;
}

export const CodeMatch: React.FC<CodeMatchProps> = ({ puzzle, onMove, disabled = false }) => {
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [availableNumbers] = useState<number[]>(puzzle.data.nextNumbers);

  const handleNumberClick = (number: number) => {
    if (disabled) return;
    
    const newSequence = [...currentSequence, number];
    setCurrentSequence(newSequence);
    
    onMove({ sequence: newSequence });
  };

  const handleSubmit = () => {
    if (disabled || currentSequence.length === 0) return;
    onMove({ sequence: currentSequence, submit: true });
  };

  const handleReset = () => {
    setCurrentSequence([]);
  };

  return (
    <div className="code-match-puzzle">
      <h4>Code Sequence Puzzle</h4>
      <div className="sequence-display">
        <p>Given sequence: {puzzle.data.sequence.join(', ')}</p>
        <p>Pattern: {puzzle.data.pattern}</p>
      </div>
      
      <div className="current-sequence">
        <h5>Your sequence:</h5>
        <div className="sequence-numbers">
          {currentSequence.map((num, index) => (
            <span key={index} className="sequence-number">{num}</span>
          ))}
        </div>
      </div>

      <div className="available-numbers">
        <h5>Available numbers:</h5>
        <div className="number-buttons">
          {availableNumbers.map((number, index) => (
            <button
              key={index}
              className="number-button"
              onClick={() => handleNumberClick(number)}
              disabled={disabled}
            >
              {number}
            </button>
          ))}
        </div>
      </div>

      <div className="code-actions">
        <button onClick={handleSubmit} disabled={disabled || currentSequence.length === 0}>
          Submit Sequence
        </button>
        <button onClick={handleReset} disabled={disabled}>
          Reset
        </button>
      </div>
    </div>
  );
};
