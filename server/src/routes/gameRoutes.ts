import { Router } from 'express';
import { GameController } from '../controllers/GameController.js';
//import { validateGameStartRequest, validateNextSceneRequest } from '../../../shared/schemas.js';
import { validateGameStartRequest, validateNextSceneRequest } from '../../../shared/dist/schemas.js';


const router = Router();
const gameController = new GameController();

// Start a new game with character creation
router.post('/game/start', async (req, res, next) => {
  try {
    console.log('Received game start request:', req.body);
    const validatedData = validateGameStartRequest(req.body);
    
    const result = await gameController.startGame(validatedData);
    console.log('Game started successfully');
    return res.json(result);
  } catch (error) {
    console.error('Error in /game/start route:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return next(error);

  }
});

// Get next scene based on player choice
router.post('/next-scene', async (req, res, next) => {
  try {
    const validatedData = validateNextSceneRequest(req.body);
    const result = await gameController.getNextScene(validatedData);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

// Get character details
router.get('/get-character/:id', async (req, res, next) => {
  try {
    const characterId = parseInt(req.params.id);
    if (isNaN(characterId)) {
      return res.status(400).json({ error: 'Invalid character ID' });
    }
    
    const result = await gameController.getCharacter(characterId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

// Get game state (character + current scene + history)
router.get('/game-state/:characterId', async (req, res, next) => {
  try {
    const characterId = parseInt(req.params.characterId);
    if (isNaN(characterId)) {
      return res.status(400).json({ error: 'Invalid character ID' });
    }
    
    const result = await gameController.getGameState(characterId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

// Get decision tree for a character
router.get('/decision-tree/:characterId', async (req, res, next) => {
  try {
    const characterId = parseInt(req.params.characterId);
    if (isNaN(characterId)) {
      return res.status(400).json({ error: 'Invalid character ID' });
    }
    
    const result = await gameController.getDecisionTree(characterId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

export { router as gameRoutes };
