import express from 'express';
import {
  addLineageMember, approveLineage, createRelationship, getLineageTree, listAdminLineages, listLineageMembers, listPendingLineages, listPublicLineages,
  reorderChildren, requestLineage, setRootMember
} from '../controllers/lineageController.js';
import { optionalProtect, protect, requirePlatformAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', requestLineage);
router.get('/', listPublicLineages);
router.get('/:slug/tree', optionalProtect, getLineageTree);
router.get('/admin/pending', protect, requirePlatformAdmin, listPendingLineages);
router.get('/admin/all', protect, requirePlatformAdmin, listAdminLineages);
router.patch('/admin/:id/approve', protect, requirePlatformAdmin, approveLineage);
router.get('/:lineageId/members', protect, requirePlatformAdmin, listLineageMembers);
router.post('/:lineageId/members', protect, requirePlatformAdmin, addLineageMember);
router.post('/:lineageId/relationships', protect, requirePlatformAdmin, createRelationship);
router.patch('/:lineageId/members/:memberId/root', protect, requirePlatformAdmin, setRootMember);
router.patch('/:lineageId/parents/:parentPersonId/children-order', protect, requirePlatformAdmin, reorderChildren);

export default router;
