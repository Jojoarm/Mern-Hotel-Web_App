// routes/clerk.ts
import express from 'express';
import clerkWebhooks from '../controllers/clerkWebhooks';

const router = express.Router();

router.post('/', clerkWebhooks);

export default router;
