import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { StatsPanel } from './StatsPanel';
import { ChoiceButtons } from './ChoiceButtons';
import { InventoryPanel } from './InventoryPanel';

export function SceneDisplay() {
  const { gameState, makeChoice, isLoading } = useGameStore();
  const [showInventory, setShowInventory] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // AUDIO REFERENCE
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Game State</h2>
          <p className="text-gray-400">Please start a new game.</p>
        </div>
      </div>
    );
  }

  const { currentScene, character } = gameState;

  // --------------------------------------------------------
  // TYPEWRITER EFFECT
  // --------------------------------------------------------
  useEffect(() => {
    if (!currentScene.description) return;

    setIsTyping(true);
    setTypingText('');

    let index = 0;
    const interval = setInterval(() => {
      if (index < currentScene.description.length) {
        setTypingText(currentScene.description.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [currentScene.description]);

  // --------------------------------------------------------
  // AMBIENT AUDIO HANDLER
  // --------------------------------------------------------
  useEffect(() => {
    const ambient = currentScene.metadata?.audioAssets?.[0];

    if (!ambient) return;

    const audio = new Audio(ambient.path);
    audio.loop = ambient.loop ?? true;
    audio.volume = ambient.volume ?? 0.7;
    audioRef.current = audio;

    audio.play().catch((err) =>
      console.warn("Audio failed to play:", err)
    );

    return () => {
      audio.pause();
    };
  }, [currentScene.id]);

  // --------------------------------------------------------
  // BACKGROUND IMAGE HANDLER
  // --------------------------------------------------------
  const backgroundImagePath =
    currentScene.metadata?.visualAssets?.[0]?.path ?? null;

  const handleChoiceSelect = async (choiceIndex: number) => {
    await makeChoice(choiceIndex);
  };

  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------

  return (
    <div
      className="min-h-screen p-4 bg-cover bg-center bg-no-repeat transition-all duration-500"
      style={{
        backgroundImage: backgroundImagePath
          ? `url(${backgroundImagePath})`
          : "none",
      }}
    >
<div className="max-w-6xl mx-auto p-4">
{/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Scene {currentScene.sceneNumber}
              </h1>
              <p className="text-gray-400">
                {character.name} the {character.class}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowInventory(!showInventory)}
                className="btn-secondary"
              >
                Inventory
              </button>
              <button
                onClick={() =>
                  useGameStore.getState().setCurrentView('decision-tree')
                }
                className="btn-secondary"
              >
                Decision Tree
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-3 space-y-6">

            {/* Scene Text */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="card bg-transparent"
              >
              <div className="scene-text">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScene.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {typingText}
                    {isTyping && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="ml-1"
                      >
                        |
                      </motion.span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Choices */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ChoiceButtons
                key={currentScene.id}
                choices={currentScene.choices}
                onChoiceSelect={handleChoiceSelect}
                isLoading={isLoading}
                character={character}
              />
            </motion.div>
          </div>

          {/* SIDE PANELS */}
          <div className="space-y-6">
            
            {/* Stats Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatsPanel character={character} />
            </motion.div>

            {/* Metadata Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card bg-transparent"
              >
              <h3 className="text-lg font-medium text-white mb-4">Scene Details</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mood:</span>
                  <span className="text-white capitalize">{currentScene.metadata.mood}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time:</span>
                  <span className="text-white capitalize">{currentScene.metadata.timeOfDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Weather:</span>
                  <span className="text-white capitalize">{currentScene.metadata.weather}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Choices:</span>
                  <span className="text-white">{currentScene.choices.length}</span>
                </div>
              </div>
            </motion.div>

            {/* Progress Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="card bg-transparent"
              >
              <h3 className="text-lg font-medium text-white mb-4">Progress</h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Scenes Completed</span>
                    <span className="text-white">
                      {gameState.gameProgress.currentSceneNumber} / 20
                    </span>
                  </div>

                  <div className="stat-bar">
                    <div
                      className="stat-fill bg-blue-500"
                      style={{
                        width:
                          `${(gameState.gameProgress.currentSceneNumber / 20) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  {gameState.sceneHistory.length} total scenes
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Inventory Panel */}
        <AnimatePresence>
          {showInventory && (
            <InventoryPanel
              character={character}
              onClose={() => setShowInventory(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
