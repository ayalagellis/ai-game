import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Trophy, Skull, Heart, HelpCircle, Star, Zap } from 'lucide-react';

const ENDING_ICONS = {
  victory: Trophy,
  defeat: Skull,
  neutral: HelpCircle,
  mystery: HelpCircle,
  romance: Heart,
  tragedy: Zap
};

const ENDING_COLORS = {
  victory: 'text-yellow-400',
  defeat: 'text-red-400',
  neutral: 'text-gray-400',
  mystery: 'text-purple-400',
  romance: 'text-pink-400',
  tragedy: 'text-orange-400'
};

const ENDING_MESSAGES = {
  victory: 'Congratulations! You have achieved victory!',
  defeat: 'Your journey has come to an end...',
  neutral: 'Your story concludes here.',
  mystery: 'The mystery remains unsolved...',
  romance: 'Love has found its way to you.',
  tragedy: 'A tragic end to your tale.'
};

export function EndingScreen() {
  const { gameState, resetGame, setCurrentView } = useGameStore();

  if (!gameState || !gameState.currentScene.isEnding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Ending Found</h2>
          <p className="text-gray-400">Something went wrong.</p>
        </div>
      </div>
    );
  }

  const { character, currentScene, sceneHistory } = gameState;
  const endingType = currentScene.endingType || 'neutral';
  const EndingIcon = ENDING_ICONS[endingType];
  const endingColor = ENDING_COLORS[endingType];
  const endingMessage = ENDING_MESSAGES[endingType];

  const handleNewGame = () => {
    resetGame();
  };

  const handleViewTree = () => {
    setCurrentView('decision-tree');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl"
      >
        {/* Ending Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <EndingIcon className={`w-24 h-24 mx-auto ${endingColor}`} />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`text-4xl font-bold mb-4 ${endingColor}`}
          >
            {endingMessage}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-xl text-gray-400"
          >
            {character.name}'s journey has reached its conclusion
          </motion.p>
        </div>

        {/* Final Scene */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Final Scene</h2>
          <div className="scene-text">
            {currentScene.description}
          </div>
        </motion.div>

        {/* Character Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="card mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Character Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Character Info */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Final Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{character.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Class:</span>
                  <span className="text-white capitalize">{character.class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Level:</span>
                  <span className="text-white">{character.stats.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Experience:</span>
                  <span className="text-white">{character.stats.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gold:</span>
                  <span className="text-yellow-400">{character.stats.gold}</span>
                </div>
              </div>
            </div>

            {/* Journey Stats */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Journey Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Scenes Completed:</span>
                  <span className="text-white">{sceneHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ending Type:</span>
                  <span className={`capitalize ${endingColor}`}>{endingType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Items Collected:</span>
                  <span className="text-white">{character.inventory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Value:</span>
                  <span className="text-white">
                    {character.inventory.reduce((sum, item) => sum + (item.value * item.quantity), 0)} gold
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            onClick={handleViewTree}
            className="btn-primary flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Star className="w-5 h-5 mr-2" />
            View Decision Tree
          </motion.button>
          
          <motion.button
            onClick={handleNewGame}
            className="btn-secondary flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5 mr-2" />
            Start New Adventure
          </motion.button>
        </motion.div>

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-12 text-gray-500 text-sm"
        >
          <p>Thank you for playing Dynamic Storylines</p>
          <p>Powered by AI-driven narrative generation</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
