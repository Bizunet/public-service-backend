import express, { type Express, type Request, type Response } from 'express';
import 'dotenv/config';
import cors from 'cors';

import authRouter from './auth.js';
import contactRouter from './contact.ts';
import reportsRouter from './reports.js';
import administratorsRouter from './administrators.js';
import announcementsRouter from './announcements.js';
import statsRouter from './stats.js';
import slidesRouter from './slides.js';


const app: Express = express();
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
}));
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World!');
});

app.use('/api/auth', authRouter);
app.use('/api/contact', contactRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/administrators', administratorsRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/slides', slidesRouter);

app.listen(3000,() => {
  console.log('Server is running on http://localhost:3000');
} );