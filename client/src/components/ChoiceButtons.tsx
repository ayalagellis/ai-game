import { motion } from 'framer-motion';
import { Choice, Character } from '@shared/types';

interface ChoiceButtonsProps {
  choices: Choice[];
  onChoiceSelect: (choiceIndex: number) => void;
  onChoiceClick?: () => void;
  isLoading: boolean;
  character: Character;
}

export function ChoiceButtons({ choices, onChoiceSelect, onChoiceClick, isLoading, character: _character }: ChoiceButtonsProps) {
  const handleChoiceClick = async (choiceIndex: number) => {
    if (isLoading) return;
    
    // Stop audio immediately when choice is clicked
    if (onChoiceClick) {
      onChoiceClick();
    }
    
    await onChoiceSelect(choiceIndex);
  };

  if (choices.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-gray-400">No choices available at this time.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-white mb-4">What do you do?</h3>
      <div className="space-y-3">
        {choices.map((choice, index) => (
          <motion.button
            key={index}
            onClick={() => handleChoiceClick(index)}
            disabled={isLoading}
            className={`choice-button w-full text-left ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center justify-between">
              <span className="text-white">{choice.text}</span>
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
            </div>
            
            {/* Show consequences preview */}
            {choice.consequences && choice.consequences.length > 0 && (
              <div className="mt-2 text-sm text-gray-400">
                <div className="flex flex-wrap gap-2">
                  {choice.consequences.map((consequence, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded text-xs ${
                        consequence.type === 'stat_change' && consequence.value > 0
                          ? 'bg-green-500/20 text-green-400'
                          : consequence.type === 'stat_change' && consequence.value < 0
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {consequence.type === 'stat_change' && (
                        <>
                          {consequence.target}: {consequence.value > 0 ? '+' : ''}{consequence.value}
                        </>
                      )}
                      {consequence.type === 'item_gain' && (
                        <>Gain: {consequence.target}</>
                      )}
                      {consequence.type === 'item_loss' && (
                        <>Lose: {consequence.target}</>
                      )}
                      {consequence.type === 'world_flag' && (
                        <>Flag: {consequence.target}</>
                      )}
                      {consequence.type === 'event' && (
                        <>Event: {consequence.target}</>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Show requirements */}
            {choice.requirements && choice.requirements.length > 0 && (
              <div className="mt-2 text-sm text-gray-400">
                <div className="flex flex-wrap gap-2">
                  {choice.requirements.map((requirement, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400"
                    >
                      Requires: {requirement.target} {requirement.operator} {requirement.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
