import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { Engine } from 'tsparticles-engine';
import { useGameStore } from '../store/gameStore';

export function ParticleManager() {
  const { gameState, particlesEnabled } = useGameStore();

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  if (!gameState || !particlesEnabled) {
    return null;
  }

  const { currentScene } = gameState;
  const particleEffects = currentScene.metadata.particleEffects;

  // Get the primary particle effect
  const primaryEffect = particleEffects[0];
  if (!primaryEffect) {
    return null;
  }

  const getParticleConfig = (effectType: string, intensity: string) => {
    const baseConfig = {
      particles: {
        number: {
          value: intensity === 'high' ? 100 : intensity === 'medium' ? 50 : 25,
        },
        color: {
          value: getParticleColor(effectType),
        },
        shape: {
          type: getParticleShape(effectType),
        },
        opacity: {
          value: { min: 0.1, max: 0.8 },
          animation: {
            enable: true,
            speed: 1,
            sync: false,
          },
        },
        size: {
          value: { min: 1, max: 3 },
          animation: {
            enable: true,
            speed: 2,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: getParticleSpeed(effectType, intensity),
          direction: getParticleDirection(effectType),
          random: true,
          straight: false,
          outModes: {
            default: 'out' as const,
          },
        },
        life: {
          duration: {
            sync: false,
            value: 3,
          },
          count: 1,
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'repulse',
          },
        },
      },
      background: {
        color: 'transparent',
      },
    };

    return baseConfig;
  };

  const getParticleColor = (effectType: string) => {
    switch (effectType) {
      case 'magic':
        return ['#8B5CF6', '#A855F7', '#C084FC'];
      case 'fire':
        return ['#F97316', '#EA580C', '#DC2626'];
      case 'smoke':
        return ['#6B7280', '#9CA3AF', '#D1D5DB'];
      case 'sparkles':
        return ['#FDE047', '#FACC15', '#EAB308'];
      case 'rain':
        return ['#3B82F6', '#60A5FA', '#93C5FD'];
      case 'snow':
        return ['#F8FAFC', '#F1F5F9', '#E2E8F0'];
      default:
        return ['#6B7280', '#9CA3AF'];
    }
  };

  const getParticleShape = (effectType: string) => {
    switch (effectType) {
      case 'magic':
      case 'sparkles':
        return 'star';
      case 'fire':
        return 'circle';
      case 'smoke':
        return 'circle';
      case 'rain':
        return 'line';
      case 'snow':
        return 'circle';
      default:
        return 'circle';
    }
  };

  const getParticleSpeed = (effectType: string, intensity: string) => {
    const baseSpeed = intensity === 'high' ? 3 : intensity === 'medium' ? 2 : 1;
    
    switch (effectType) {
      case 'magic':
        return baseSpeed * 0.5;
      case 'fire':
        return baseSpeed * 0.3;
      case 'smoke':
        return baseSpeed * 0.2;
      case 'sparkles':
        return baseSpeed * 0.8;
      case 'rain':
        return baseSpeed * 2;
      case 'snow':
        return baseSpeed * 0.5;
      default:
        return baseSpeed;
    }
  };

  const getParticleDirection = (effectType: string): 'top' | 'bottom' | 'none' => {
    switch (effectType) {
      case 'rain':
        return 'bottom';
      case 'snow':
        return 'bottom';
      case 'fire':
        return 'top';
      case 'smoke':
        return 'top';
      default:
        return 'none';
    }
  };

  const config = getParticleConfig(primaryEffect.type, primaryEffect.intensity);

  return (
    <div className="particle-container">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={config}
      />
    </div>
  );
}
