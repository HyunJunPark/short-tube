import { Router } from 'express';
import { briefingController } from '../controllers/briefing.controller';

const router = Router();

router.get('/:date', briefingController.get);
router.post('/generate', briefingController.generate);

export default router;
