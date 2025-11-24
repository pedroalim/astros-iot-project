import { Router } from 'express';
import { getAstroData } from '../controllers/astroController';

const router = Router();

// Rota GET: http://localhost:3000/api/astro
router.get('/astro', getAstroData);

export default router;