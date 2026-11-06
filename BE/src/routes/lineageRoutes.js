import express from 'express';
import {
  addLineageMember, approveLineage, createRelationship, getLineageTree, listAdminLineages, listLineageMembers, listMyLineages, listPendingLineages, listPublicLineages,
  quickAddPerson, updateLineage, reorderChildren, requestLineage, setRootMember
} from '../controllers/lineageController.js';
import { optionalProtect, protect, requireLineageOwnerOrAdmin, requirePlatformAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Creating a lineage now requires an account, so every lineage has a real
// owner (see requestLineage) — anyone can still get one via /signup first.
router.post('/', protect, requestLineage);
router.get('/', listPublicLineages);
router.get('/mine', protect, listMyLineages);
router.get('/:slug/tree', optionalProtect, getLineageTree);
router.get('/admin/pending', protect, requirePlatformAdmin, listPendingLineages);
router.get('/admin/all', protect, requirePlatformAdmin, listAdminLineages);
router.patch('/admin/:id/approve', protect, requirePlatformAdmin, approveLineage);
// These four stay available to a platform_admin (any lineage) but now also
// open to the lineage_owner who requested THIS specific lineage — see
// requireLineageOwnerOrAdmin. Lineage approval itself (above) stays
// platform_admin-only; this is just managing an already-approved lineage's
// own content.
router.get('/:lineageId/members', protect, requireLineageOwnerOrAdmin, listLineageMembers);
router.post('/:lineageId/members', protect, requireLineageOwnerOrAdmin, addLineageMember);
router.patch('/:lineageId', protect, requireLineageOwnerOrAdmin, updateLineage);
router.post('/:lineageId/quick-add', protect, requireLineageOwnerOrAdmin, quickAddPerson);
router.post('/:lineageId/relationships', protect, requireLineageOwnerOrAdmin, createRelationship);
router.patch('/:lineageId/members/:memberId/root', protect, requireLineageOwnerOrAdmin, setRootMember);
router.patch('/:lineageId/parents/:parentPersonId/children-order', protect, requireLineageOwnerOrAdmin, reorderChildren);

export default router;
