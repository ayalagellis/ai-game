import { motion, AnimatePresence } from 'framer-motion';
import { Character } from '@shared/types';
import { X, Package, Sword, Shield, Zap } from 'lucide-react';

interface InventoryPanelProps {
  character: Character;
  onClose: () => void;
}

export function InventoryPanel({ character, onClose }: InventoryPanelProps) {
  const { inventory } = character;

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'weapon':
        return <Sword className="w-5 h-5 text-red-400" />;
      case 'armor':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'consumable':
        return <Zap className="w-5 h-5 text-green-400" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const getItemRarity = (value: number) => {
    if (value >= 100) return 'text-purple-400';
    if (value >= 50) return 'text-blue-400';
    if (value >= 25) return 'text-green-400';
    return 'text-gray-400';
  };

  return (
    <AnimatePresence>
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
          className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Package className="w-6 h-6 mr-2 text-blue-400" />
              Inventory
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Inventory Items */}
          <div className="overflow-y-auto max-h-[60vh]">
            {inventory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Your inventory is empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="inventory-item"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        {getItemIcon(item.type)}
                        <h3 className={`font-medium ml-2 ${getItemRarity(item.value)}`}>
                          {item.name}
                        </h3>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-400">Value: {item.value}</div>
                        {item.quantity > 1 && (
                          <div className="text-blue-400">x{item.quantity}</div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                    
                    {/* Item Effects */}
                    {item.effects && item.effects.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">Effects:</div>
                        {item.effects.map((effect, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                          >
                            {effect.type}: {effect.target} {effect.value > 0 ? '+' : ''}{effect.value}
                            {effect.duration && ` (${effect.duration}s)`}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>{inventory.length} items</span>
              <span>Total Value: {inventory.reduce((sum, item) => sum + (item.value * item.quantity), 0)} gold</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
