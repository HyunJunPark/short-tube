import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { validate } from '../middleware/validate';
import { updateSettingsSchema } from '../schemas/settings.schema';

const router = Router();

router.get('/', settingsController.get);
router.patch('/', validate(updateSettingsSchema), settingsController.update);
router.post('/telegram/test', settingsController.testTelegram);

export default router;
