import { Router } from 'express';
import { videoController } from '../controllers/video.controller';

const router = Router();

router.get('/stats', videoController.getStats);
router.get('/channel/:channelId', videoController.getByChannel);
router.post('/refresh/:channelId', videoController.refresh);

export default router;
