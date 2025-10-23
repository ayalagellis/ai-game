import { Router } from 'express';
import { GameController } from '../controllers/GameController';
import { validateGameStartRequest, validateNextSceneRequest } from '../../shared/schemas';

const router = Router();
const gameController = new GameController();

// Start a new game with character creation
router.post('/game/start', async (req, res, next) => {
  try {
    const validatedData = validateGameStartRequest(req.body);
    const result = await gameController.startGame(validatedData);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get next scene based on player choice
router.post('/next-scene', async (req, res, next) => {
  try {
    const validatedData = validateNextSceneRequest(req.body);
    const result = await gameController.getNextScene(validatedData);
    res.json(result);
  } catch (error) {
    next(error);
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
    res.json(result);
  } catch (error) {
    next(error);
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
    res.json(result);
  } catch (error) {
    next(error);
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
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as gameRoutes };
