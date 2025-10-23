# Asset Directories

This directory contains all the visual, audio, and particle assets for the Dynamic Storylines game.

## Directory Structure

- `backgrounds/` - Scene background images
- `sounds/` - Audio files (ambient, music, SFX, voice)
- `particles/` - Particle effect configurations
- `icons/` - UI icons and character sprites

## Asset Requirements

### Backgrounds
- Format: JPG, PNG, WebP
- Resolution: 1920x1080 or higher
- Naming: descriptive names (e.g., `forest_path.jpg`, `castle_interior.png`)

### Sounds
- Format: MP3, OGG, WAV
- Quality: 44.1kHz, 16-bit minimum
- Naming: descriptive names (e.g., `forest_ambient.mp3`, `magic_spell.wav`)

### Particles
- Format: JSON configuration files
- Naming: effect type (e.g., `magic.json`, `fire.json`)

### Icons
- Format: SVG, PNG
- Size: 24x24, 32x32, 64x64 pixels
- Naming: descriptive names (e.g., `sword.svg`, `shield.png`)

## Adding Assets

1. Place files in the appropriate directory
2. Use descriptive, lowercase names with underscores
3. Ensure files are optimized for web delivery
4. Test assets in the game to ensure proper loading

## Asset Mapping

The game automatically maps assets based on the AI-generated scene metadata. The AI will reference asset names that should exist in these directories.
