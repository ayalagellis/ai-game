import { motion } from 'framer-motion';
import { Character } from '@shared/types';

interface StatsPanelProps {
  character: Character;
}

export function StatsPanel({ character }: StatsPanelProps) {
  const { stats } = character;

  const getStatColor = (value: number, max: number = 20) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHealthColor = () => {
    const percentage = (stats.health / stats.maxHealth) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getManaColor = () => {
    const percentage = (stats.mana / stats.maxMana) * 100;
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-blue-400';
    if (percentage >= 40) return 'bg-blue-300';
    return 'bg-blue-200';
  };

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-white mb-4">Character Stats</h3>
      
      {/* Health and Mana */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Health</span>
            <span className="text-white">{stats.health} / {stats.maxHealth}</span>
          </div>
          <div className="stat-bar">
            <motion.div
              className={`stat-fill ${getHealthColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Mana</span>
            <span className="text-white">{stats.mana} / {stats.maxMana}</span>
          </div>
          <div className="stat-bar">
            <motion.div
              className={`stat-fill ${getManaColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${(stats.mana / stats.maxMana) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Strength</span>
              <span className="text-white">{stats.strength}</span>
            </div>
            <div className="stat-bar">
              <motion.div
                className={`stat-fill ${getStatColor(stats.strength)}`}
                initial={{ width: 0 }}
                animate={{ width: `${(stats.strength / 20) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Intelligence</span>
              <span className="text-white">{stats.intelligence}</span>
            </div>
            <div className="stat-bar">
              <motion.div
                className={`stat-fill ${getStatColor(stats.intelligence)}`}
                initial={{ width: 0 }}
                animate={{ width: `${(stats.intelligence / 20) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Dexterity</span>
              <span className="text-white">{stats.dexterity}</span>
            </div>
            <div className="stat-bar">
              <motion.div
                className={`stat-fill ${getStatColor(stats.dexterity)}`}
                initial={{ width: 0 }}
                animate={{ width: `${(stats.dexterity / 20) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Charisma</span>
              <span className="text-white">{stats.charisma}</span>
            </div>
            <div className="stat-bar">
              <motion.div
                className={`stat-fill ${getStatColor(stats.charisma)}`}
                initial={{ width: 0 }}
                animate={{ width: `${(stats.charisma / 20) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Wisdom</span>
              <span className="text-white">{stats.wisdom}</span>
            </div>
            <div className="stat-bar">
              <motion.div
                className={`stat-fill ${getStatColor(stats.wisdom)}`}
                initial={{ width: 0 }}
                animate={{ width: `${(stats.wisdom / 20) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Constitution</span>
              <span className="text-white">{stats.constitution}</span>
            </div>
            <div className="stat-bar">
              <motion.div
                className={`stat-fill ${getStatColor(stats.constitution)}`}
                initial={{ width: 0 }}
                animate={{ width: `${(stats.constitution / 20) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.9 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Level and Experience */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Level {stats.level}</span>
          <span className="text-white">{stats.experience} XP</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Gold</span>
          <span className="text-yellow-400">{stats.gold} 🪙</span>
        </div>
      </div>
    </div>
  );
}
