import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { validate } from '../middleware/validate';
import {
  addSubscriptionSchema,
  updateSubscriptionSchema,
  deleteSubscriptionSchema,
} from '../schemas/subscription.schema';

const router = Router();

router.get('/', subscriptionController.getAll);
router.post('/', validate(addSubscriptionSchema), subscriptionController.add);
router.patch('/:channelId', validate(updateSubscriptionSchema), subscriptionController.update);
router.delete('/:channelId', validate(deleteSubscriptionSchema), subscriptionController.delete);

export default router;
