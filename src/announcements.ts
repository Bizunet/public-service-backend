import { Router, type Response } from 'express';
import prisma from './prisma.js';
import { requireAdmin, type AuthenticatedRequest } from './auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  const announcements = await prisma.announcement.findMany({
    where: { published: true }, orderBy: { createdAt: 'desc' },
  });
  return res.json(announcements);
});

router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { title, body, published = true } = req.body;
  if (!req.userId || !title?.trim() || !body?.trim()) {
    return res.status(400).json({ message: 'Title and body are required' });
  }
  const announcement = await prisma.announcement.create({
    data: { title: title.trim(), body: body.trim(), published: Boolean(published), authorId: req.userId },
  });
  return res.status(201).json(announcement);
});

router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid announcement id' });
  try {
    const announcement = await prisma.announcement.update({
      where: { id }, data: { title: req.body.title?.trim(), body: req.body.body?.trim(), published: req.body.published },
    });
    return res.json(announcement);
  } catch {
    return res.status(404).json({ message: 'Announcement not found' });
  }
});

router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid announcement id' });
  try { await prisma.announcement.delete({ where: { id } }); return res.status(204).send(); }
  catch { return res.status(404).json({ message: 'Announcement not found' }); }
});

export default router;