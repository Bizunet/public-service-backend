import { Router, type Request, type Response } from 'express';
import prisma from './prisma.js';
import { requireAdmin } from './auth.js';

const router = Router();

router.get('/admin', requireAdmin, async (_req, res) => {
  try { return res.json(await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } })); }
  catch { return res.status(500).json({ message: 'Unable to load contact messages' }); }
});

router.patch('/admin/:id/read', requireAdmin, async (req, res) => {
  try { return res.json(await prisma.contactMessage.update({ where: { id: Number(req.params.id) }, data: { isRead: true } })); }
  catch { return res.status(404).json({ message: 'Message not found' }); }
});

router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try { await prisma.contactMessage.delete({ where: { id: Number(req.params.id) } }); return res.status(204).send(); }
  catch { return res.status(404).json({ message: 'Message not found' }); }
});

function createReference(): string {
  const year = new Date().getFullYear();
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return `HZ-MSG-${year}-${randomNumber}`;
}

router.post('/', async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ message: 'Name, email, subject, and message are required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  try {
    const contactMessage = await prisma.contactMessage.create({
      data: {
        reference: createReference(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      },
      select: { reference: true },
    });

    return res.status(201).json(contactMessage);
  } catch {
    return res.status(500).json({ message: 'Unable to send message' });
  }
});

export default router;