import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { GameStartRequest } from '@shared/types';

const CHARACTER_CLASSES = [
  { value: 'warrior', label: 'Warrior', description: 'A strong fighter with high health and strength' },
  { value: 'mage', label: 'Mage', description: 'A spellcaster with high intelligence and mana' },
  { value: 'rogue', label: 'Rogue', description: 'A stealthy character with high dexterity' },
  { value: 'cleric', label: 'Cleric', description: 'A holy warrior with healing abilities' }
];

const BACKGROUND_TEMPLATES = [
  'A former soldier seeking redemption',
  'A scholar exploring ancient mysteries',
  'A merchant looking for adventure',
  'A noble seeking to prove their worth',
  'A commoner with hidden potential',
  'A wanderer with a mysterious past'
];

export function CharacterCreation() {
  const { characterForm, setCharacterForm, startGame, isLoading } = useGameStore();
  const [customBackground, setCustomBackground] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!characterForm.name || !characterForm.class || (!characterForm.background && !customBackground)) {
      return;
    }

    const request: GameStartRequest = {
      characterName: characterForm.name,
      characterClass: characterForm.class,
      characterBackground: characterForm.background || customBackground
    };

    await startGame(request);
  };

  const isFormValid = characterForm.name && characterForm.class && (characterForm.background || customBackground);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Create Your Character
          </h1>
          <p className="text-gray-400 text-lg">
            Begin your journey in the world of Dynamic Storylines
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="card space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Character Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Character Name
            </label>
            <input
              id="name"
              type="text"
              value={characterForm.name}
              onChange={(e) => setCharacterForm({ name: e.target.value })}
              className="input-field w-full"
              placeholder="Enter your character's name"
              maxLength={50}
              required
            />
          </div>

          {/* Character Class */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Character Class
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CHARACTER_CLASSES.map((cls) => (
                <motion.button
                  key={cls.value}
                  type="button"
                  onClick={() => setCharacterForm({ class: cls.value })}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    characterForm.class === cls.value
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-medium text-white">{cls.label}</div>
                  <div className="text-sm text-gray-400 mt-1">{cls.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Character Background */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Character Background
            </label>
            
            {/* Template Backgrounds */}
            <div className="space-y-2 mb-4">
              {BACKGROUND_TEMPLATES.map((template, index) => (
                <motion.button
                  key={index}
                  type="button"
                  onClick={() => {
                    setCharacterForm({ background: template });
                    setCustomBackground('');
                  }}
                  className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                    characterForm.background === template
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="text-gray-300">{template}</span>
                </motion.button>
              ))}
            </div>

            {/* Custom Background */}
            <div>
              <label htmlFor="customBackground" className="block text-sm font-medium text-gray-300 mb-2">
                Or write your own background
              </label>
              <textarea
                id="customBackground"
                value={customBackground}
                onChange={(e) => {
                  setCustomBackground(e.target.value);
                  if (e.target.value) {
                    setCharacterForm({ background: '' });
                  }
                }}
                className="input-field w-full h-24 resize-none"
                placeholder="Describe your character's background, motivations, and history..."
                maxLength={500}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {customBackground.length}/500
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
              isFormValid && !isLoading
                ? 'btn-primary'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={isFormValid && !isLoading ? { scale: 1.02 } : {}}
            whileTap={isFormValid && !isLoading ? { scale: 0.98 } : {}}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Character...
              </div>
            ) : (
              'Begin Adventure'
            )}
          </motion.button>
        </motion.form>

        {/* Character Preview */}
        {characterForm.name && characterForm.class && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 card"
          >
            <h3 className="text-lg font-medium text-white mb-4">Character Preview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white">{characterForm.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Class:</span>
                <span className="text-white capitalize">{characterForm.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Background:</span>
                <span className="text-white text-sm">
                  {(characterForm.background || customBackground).substring(0, 50)}
                  {(characterForm.background || customBackground).length > 50 && '...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
