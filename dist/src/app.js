import express, {} from 'express';
import 'dotenv/config';
import cors from 'cors';
import authRouter from './auth.js';
import contactRouter from './contact.js';
import reportsRouter from './reports.js';
import administratorsRouter from './administrators.js';
import announcementsRouter from './announcements.js';
const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
}));
app.use(express.json());
app.get('/', (_req, res) => {
    res.send('Hello World!');
});
app.use('/api/auth', authRouter);
app.use('/api/contact', contactRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/administrators', administratorsRouter);
app.use('/api/announcements', announcementsRouter);
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
