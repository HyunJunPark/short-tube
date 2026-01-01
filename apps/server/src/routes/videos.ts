import { Router } from 'express';
import { videoController } from '../controllers/video.controller';

const router = Router();

router.get('/stats', videoController.getStats);
router.post('/check-new', videoController.checkNewVideos);
router.post('/mark-checked/:channelId', videoController.markNotificationsChecked);
router.get('/channel/:channelId', videoController.getByChannel);
router.post('/refresh/:channelId', videoController.refresh);

export default router;
