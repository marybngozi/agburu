import express from 'express';
import { getHome } from '../controllers/homeController.js';

const router = express.Router();
router.get('', getHome);
// Lightweight liveness check for uptime monitors / keep-alive pings.
router.get('/health', (req, res) => res.json({ ok: true }));

export default router;
