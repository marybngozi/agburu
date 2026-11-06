import express from 'express';
import {
  createPerson, getPeople, getPeopleByIds, getPersonById, toggleSoftDelete, updatePerson
} from '../controllers/personController.js';
import { optionalProtect, protect, requireContentManager, requirePersonOwnerOrAdmin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Reads honour lineage visibility: a person in a private (or still-pending)
// lineage is only returned to someone allowed to see that lineage — see
// utils/access.js. The directory listing needs an account and is scoped
// to the caller's own records unless they are a platform_admin.
router.get('/', protect, getPeople);
router.post('/by-ids', optionalProtect, getPeopleByIds);
router.get('/:id', optionalProtect, getPersonById);

// Writes: platform_admin and lineage_owner only (a profile_editor goes
// through change requests instead). A lineage_owner can edit or delete only
// people they created themselves.
router.post('/', protect, requireContentManager, upload.single('profilePicture'), createPerson);
router.put('/:id', protect, requirePersonOwnerOrAdmin, upload.single('profilePicture'), updatePerson);
router.patch('/:id/soft-delete', protect, requirePersonOwnerOrAdmin, toggleSoftDelete);

export default router;
