import { Router } from 'express';
import authRoutes from './auth';
import subscriptionRoutes from './subscriptions';
import videoRoutes from './videos';
import summaryRoutes from './summaries';
import briefingRoutes from './briefing';
import settingsRoutes from './settings';
import monitorRoutes from './monitor';

const router = Router();

router.use('/auth', authRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/videos', videoRoutes);
router.use('/summaries', summaryRoutes);
router.use('/briefing', briefingRoutes);
router.use('/settings', settingsRoutes);
router.use('/monitor', monitorRoutes);

export default router;
