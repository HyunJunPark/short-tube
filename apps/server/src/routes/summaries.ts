import { Router } from 'express';
import { summaryController } from '../controllers/summary.controller';
import { validate } from '../middleware/validate';
import { generateSummarySchema, getSummariesSchema } from '../schemas/summary.schema';

const router = Router();

router.get('/', validate(getSummariesSchema), summaryController.getAll);
router.post('/', validate(generateSummarySchema), summaryController.generate);
router.get('/date/:date', summaryController.getByDate);
router.get('/:videoId', summaryController.getByVideoId);

export default router;
