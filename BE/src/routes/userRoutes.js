import express from 'express';
import {
  createProfileEditor, listPendingChanges, regeneratePassword, reviewProfileChange, submitProfileChange
} from '../controllers/userController.js';
import { protect, requirePlatformAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/profile-editors', protect, requirePlatformAdmin, createProfileEditor);
router.post('/profile-editors/:id/regenerate-password', protect, requirePlatformAdmin, regeneratePassword);
router.post('/people/:personId/change-requests', protect, submitProfileChange);
router.get('/change-requests/pending', protect, requirePlatformAdmin, listPendingChanges);
router.patch('/change-requests/:id', protect, requirePlatformAdmin, reviewProfileChange);

export default router;
