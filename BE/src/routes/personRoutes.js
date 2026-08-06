import express from 'express';
import { 
  getPeople, 
  getPeopleByIds, 
  getRootPerson, 
  getPersonById, 
  createPerson, 
  updatePerson, 
  toggleSoftDelete 
} from '../controllers/personController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getPeople);
router.get('/root', getRootPerson);
router.get('/:id', getPersonById);
router.post('/by-ids', getPeopleByIds);

// Admin Protected Routes
router.post('/', protect, upload.single('profilePicture'), createPerson);
router.put('/:id', protect, upload.single('profilePicture'), updatePerson);
router.patch('/:id/soft-delete', protect, toggleSoftDelete);

export default router;