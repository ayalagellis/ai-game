# Dynamic Storylines

A full-stack interactive storytelling game with AI-driven dynamic storylines. Features Gemini powered narrative generation, MCP integration for persistent state management, and a modern React frontend with visual effects.

## Features

- **AI-Driven Storytelling**: Gemini generates dynamic, branching narratives based on player choices
- **Persistent State Management**: MCP tools handle character stats, inventory, and world state
- **Modern UI**: React 18 with Framer Motion animations and particle effects
- **Audio Integration**: Ambient sounds and audio feedback with Howler.js
- **Decision Tree Visualization**: React Flow powered decision tree display
- **Character Progression**: Stats tracking, inventory management, and character development

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- Zustand for state management
- TailwindCSS for styling
- Framer Motion for animations
- tsparticles for visual effects
- React Flow for decision trees
- Howler.js for audio
- Lucide React for icons

### Backend
- Node.js + Express + TypeScript
- Gemini
- MCP (Model Context Protocol) SDK
- PostgreSQL database

## Getting Started

### Quick Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**Linux/macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

1. **Prerequisites:**
   - Node.js 18+ 
   - npm
   - PostgreSQL 12+

2. **Install dependencies:**
```bash
npm run install:all
```

3. **Set up environment variables:**
```bash
# Copy and configure environment files
cp server/env.example server/.env
cp client/env.example client/.env
```

4. **Configure environment variables:**
   - Edit `server/.env` with your database credentials and Gemini API key
   - Edit `client/.env` with your API configuration

5. **Set up the database:**
```bash
# Create database
createdb dynamic_storylines

# Run database migrations
cd server && npm run db:migrate
```

6. **Start development servers:**
```bash
npm run dev
```

### Environment Variables

**Server (.env):**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/dynamic_storylines
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

**Client (.env):**
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_AUDIO=true
VITE_ENABLE_PARTICLES=true
VITE_ENABLE_ANIMATIONS=true
```

## Game Flow

1. **Character Creation**: Player creates character with name, class, and background
2. **AI Scene Generation**: Gemini generates dynamic scenes based on character and choices
3. **Visual Rendering**: Frontend maps visual assets, plays audio, and shows particles
4. **Player Choice**: Player selects from AI-generated choices
5. **State Update**: MCP tools update character stats and world state
6. **Repeat**: Process continues until ending or maximum scenes reached
7. **Ending Screen**: Display summary and decision tree visualization

## AI Agent Behavior

The AI agent tracks:
- Character stats and inventory
- World flags and events
- Scene history and context
- Player choice consequences
- Random events and branching narratives

## Asset Integration

The game is designed to work with free asset packs. Users can add:
- Background images to `client/src/assets/backgrounds/`
- Audio files to `client/src/assets/sounds/`
- Particle configurations to `client/src/assets/particles/`
- Icons to `client/src/assets/icons/`

## API Endpoints

- `POST /api/game/start` - Start new game with character
- `POST /api/next-scene` - Get next scene based on choice
- `GET /api/get-character/:id` - Get character details

## Development

- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:5173`
- Database connection configured via environment variables

## Project Structure

```
dynamic-storylines/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── store/          # Zustand state management
│   │   ├── api/            # API client
│   │   ├── assets/         # Game assets (images, sounds, etc.)
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # API controllers
│   │   ├── services/      # Business logic (AI, MCP, etc.)
│   │   ├── routes/        # API routes
│   │   ├── db/            # Database setup
│   │   └── utils/         # Utility functions
│   └── package.json
├── shared/                 # Shared types and schemas
│   ├── types.ts           # TypeScript interfaces
│   └── schemas.ts         # Zod validation schemas
├── setup.sh               # Linux/macOS setup script
├── setup.bat              # Windows setup script
└── README.md
```

## Key Features

### AI-Driven Storytelling
- **Gemini Integration**: Advanced AI generates dynamic, branching narratives
- **Context Awareness**: AI tracks character stats, inventory, and world state
- **Consequence System**: Player choices have meaningful impacts on the story
- **Ending Generation**: AI determines appropriate story conclusions

### Persistent State Management
- **Character Progression**: Stats, inventory, and experience tracking
- **World Flags**: Persistent world state and event tracking
- **Scene History**: Complete record of player's journey

### Modern UI/UX
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Animations**: Framer Motion for fluid transitions
- **Particle Effects**: Visual atmosphere with tsparticles
- **Audio Integration**: Ambient sounds and music with Howler.js
- **Decision Tree**: Visual representation of player choices

### Technical Architecture
- **Type Safety**: Full TypeScript implementation
- **State Management**: Zustand for efficient state handling
- **API Design**: RESTful API with proper error handling
- **Database**: PostgreSQL with proper schema design
- **Validation**: Zod schemas for data validation

## API Endpoints

### Game Management
- `POST /api/game/start` - Start new game with character
- `POST /api/next-scene` - Get next scene based on choice
- `GET /api/game-state/:characterId` - Get full game state
- `GET /api/get-character/:id` - Get character details

### Decision Tree
- `GET /api/decision-tree/:characterId` - Get decision tree visualization

### Health Check
- `GET /api/health` - Server health status

## Asset Integration

The game is designed to work with free asset packs. Users can add:

### Visual Assets
- **Backgrounds**: Scene backgrounds (`client/src/assets/backgrounds/`)
- **Icons**: UI icons and character sprites (`client/src/assets/icons/`)

### Audio Assets
- **Ambient Sounds**: Environmental audio (`client/src/assets/sounds/`)
- **Music**: Background music tracks
- **SFX**: Sound effects for actions

