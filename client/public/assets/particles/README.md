# Particle Effects

Place your particle effect configurations here. The AI will reference these assets when generating scenes.

## File Format

Particle effects are defined as JSON configuration files that specify the visual properties and behavior of particles.

## Recommended Specifications

- **Format**: JSON
- **File Size**: Under 1KB per configuration
- **Naming**: Use effect type names (e.g., `magic.json`, `fire.json`)

## Example Configurations

### Magic Effects
- `magic.json` - Sparkling magical particles
- `healing.json` - Gentle healing light particles
- `teleport.json` - Teleportation effect particles

### Environmental Effects
- `fire.json` - Fire and ember particles
- `smoke.json` - Smoke and fog particles
- `rain.json` - Rain particle effects
- `snow.json` - Snow particle effects
- `leaves.json` - Falling leaves particles

### Combat Effects
- `explosion.json` - Explosion particle effects
- `blood.json` - Blood splatter particles
- `dust.json` - Dust and debris particles

## Configuration Structure

```json
{
  "type": "magic",
  "intensity": "medium",
  "duration": 5000,
  "particles": {
    "number": 50,
    "color": ["#8B5CF6", "#A855F7", "#C084FC"],
    "shape": "star",
    "size": { "min": 1, "max": 3 },
    "speed": 1.5,
    "direction": "none"
  }
}
```

## Usage

The AI will automatically select appropriate particle effects based on the scene context and mood. Make sure to name your files descriptively so the AI can reference them correctly.
