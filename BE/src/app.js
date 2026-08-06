import express from 'express';
import cors from 'cors';
import homeRoutes from './routes/homeRoutes.js';
import authRoutes from './routes/authRoutes.js';
import personRoutes from './routes/personRoutes.js';

const app = express();

// Explicitly configure CORS for Vite local dev server
app.use(cors({
  origin: ["*", 
    // 'http://localhost:5173', 
    // 'http://127.0.0.1:5173'
  ],
  credentials: true,
  // methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/', homeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/people', personRoutes);

export default app;