import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useGameStore } from '../store/gameStore';

export function AudioManager() {
  const { gameState, audioEnabled } = useGameStore();
  const audioRef = useRef<Howl | null>(null);

  useEffect(() => {
    if (!gameState || !audioEnabled) return;

    const { currentScene } = gameState;
    const audioAssets = currentScene.metadata.audioAssets;

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.stop();
    }

    // Play ambient audio if available
    const ambientAudio = audioAssets.find(asset => asset.type === 'ambient');
    if (ambientAudio) {
      try {
        audioRef.current = new Howl({
          src: [ambientAudio.path],
          volume: ambientAudio.volume || 0.5,
          loop: ambientAudio.loop ?? true,
          onloaderror: () => {
            console.warn('Failed to load audio:', ambientAudio.path);
          }
        });

        const soundId = audioRef.current.play();
        // Apply fade-in if specified
        if (ambientAudio.fadeIn) {
          audioRef.current.fade(0, ambientAudio.volume || 0.5, ambientAudio.fadeIn, soundId);
        }
      } catch (error) {
        console.warn('Audio playback error:', error);
      }
    }

    // Cleanup on unmount or scene change
    return () => {
      if (audioRef.current) {
        audioRef.current.stop();
      }
    };
  }, [gameState?.currentScene.id, audioEnabled]);

  // Handle audio enabled/disabled
  useEffect(() => {
    if (!audioEnabled && audioRef.current) {
      audioRef.current.stop();
    }
  }, [audioEnabled]);

  return null; // This component doesn't render anything
}
