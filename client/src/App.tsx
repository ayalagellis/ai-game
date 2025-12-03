import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { CharacterCreation } from './components/CharacterCreation';
import { SceneDisplay } from './components/SceneDisplay';
import { EndingScreen } from './components/EndingScreen';
import { DecisionTree } from './components/DecisionTree';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { AudioManager } from './components/AudioManager';
import { ParticleManager } from './components/ParticleManager';
import { SettingsPanel } from './components/SettingsPanel';

function App() {
  const { 
    currentView, 
    isLoading, 
    error, 
    gameState,
    audioEnabled,
    particlesEnabled,
    animationsEnabled,
    setError
  } = useGameStore();

  const [showSettings, setShowSettings] = useState(false);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'character-creation':
        return <CharacterCreation key="character-creation" />;
      case 'game':
        return <SceneDisplay key="game" />;
      case 'ending':
        return <EndingScreen key="ending" />;
      case 'decision-tree':
        return <DecisionTree key="decision-tree" />;
      default:
        return <CharacterCreation key="character-creation-default" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Effects */}
      {particlesEnabled && <ParticleManager />}
      
      {/* Audio Manager */}
      {audioEnabled && <AudioManager />}
      
      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-2 transition-colors duration-200"
        aria-label="Settings"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10">
        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <LoadingSpinner key="loading" />
          ) : error ? (
            <ErrorMessage key="error" message={error} />
          ) : (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: animationsEnabled ? 0.5 : 0 }}
              className="min-h-screen"
            >
              {renderCurrentView()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-4 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Dynamic Storylines</span>
            <span>•</span>
            <span>AI-Powered Interactive Fiction</span>
          </div>
          <div className="flex items-center space-x-4">
            {gameState && (
              <>
                <span>Scene {gameState.gameProgress.currentSceneNumber}</span>
                <span>•</span>
                <span>{gameState.character.name}</span>
                <span>•</span>
                <span className="capitalize">{gameState.character.class}</span>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
