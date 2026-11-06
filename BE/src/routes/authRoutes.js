import express from 'express';
import { loginAdmin, getMe, signup } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/login', loginAdmin);
router.post('/signup', signup);
router.get('/me', protect, getMe);

export default router;