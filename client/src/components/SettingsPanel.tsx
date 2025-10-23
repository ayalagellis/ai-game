import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { X, Volume2, VolumeX, Sparkles, SparklesOff, Zap, ZapOff } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    audioEnabled,
    particlesEnabled,
    animationsEnabled,
    toggleAudio,
    toggleParticles,
    toggleAnimations,
    resetGame
  } = useGameStore();

  const handleResetGame = () => {
    if (window.confirm('Are you sure you want to reset the game? This will start a new character creation.')) {
      resetGame();
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          {/* Audio Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Audio</h3>
            <button
              onClick={toggleAudio}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                audioEnabled
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-gray-600 bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                {audioEnabled ? (
                  <Volume2 className="w-5 h-5 text-green-400 mr-3" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400 mr-3" />
                )}
                <span className="text-white">Audio Effects</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                audioEnabled ? 'bg-green-500' : 'bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                  audioEnabled ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`} />
              </div>
            </button>
          </div>

          {/* Visual Effects */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Visual Effects</h3>
            
            {/* Particles */}
            <button
              onClick={toggleParticles}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 mb-3 ${
                particlesEnabled
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                {particlesEnabled ? (
                  <Sparkles className="w-5 h-5 text-blue-400 mr-3" />
                ) : (
                  <SparklesOff className="w-5 h-5 text-gray-400 mr-3" />
                )}
                <span className="text-white">Particle Effects</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                particlesEnabled ? 'bg-blue-500' : 'bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                  particlesEnabled ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`} />
              </div>
            </button>

            {/* Animations */}
            <button
              onClick={toggleAnimations}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                animationsEnabled
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                {animationsEnabled ? (
                  <Zap className="w-5 h-5 text-purple-400 mr-3" />
                ) : (
                  <ZapOff className="w-5 h-5 text-gray-400 mr-3" />
                )}
                <span className="text-white">Animations</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                animationsEnabled ? 'bg-purple-500' : 'bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                  animationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`} />
              </div>
            </button>
          </div>

          {/* Game Actions */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Game Actions</h3>
            <button
              onClick={handleResetGame}
              className="w-full btn-danger flex items-center justify-center"
            >
              <Zap className="w-5 h-5 mr-2" />
              Reset Game
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>Dynamic Storylines v1.0.0</p>
          <p>AI-Powered Interactive Fiction</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
