import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import prisma from './prisma.js';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { requireAdmin, type AuthenticatedRequest } from './auth.js';
import type { Administrator } from './generated/prisma/client.js';

const router = Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_PICTURES_BUCKET || 'pictures';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

async function signedPhoto(imagePath: string) {
  const { data } = await supabase.storage.from(storageBucket).createSignedUrl(imagePath, 3600);
  return data?.signedUrl || null;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const administrators = await prisma.administrator.findMany({
      orderBy: [{ isLeader: 'desc' }, { nameEn: 'asc' }],
    });

    const result = await Promise.all(administrators.map(async (administrator: Administrator) => {
      return { ...administrator, photo: await signedPhoto(administrator.imagePath) };
    }));

    return res.json(result);
  } catch {
    return res.status(500).json({ message: 'Unable to load administrators' });
  }
});

router.put('/:id', requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid administrator id' });

  try {
    const current = await prisma.administrator.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ message: 'Administrator not found' });

    let imagePath = current.imagePath;
    const image = req.file;
    if (image) {
      if (!['image/jpeg', 'image/png'].includes(image.mimetype)) {
        return res.status(400).json({ message: 'Only JPG and PNG images are allowed' });
      }
      imagePath = `administrators/${current.key}/${randomUUID()}${path.extname(image.originalname).toLowerCase()}`;
      const { error } = await supabase.storage.from(storageBucket).upload(imagePath, image.buffer, {
        contentType: image.mimetype,
        upsert: false,
      });
      if (error) return res.status(502).json({ message: 'Unable to upload administrator image' });
    }

    const updated = await prisma.administrator.update({
      where: { id },
      data: {
        nameAm: req.body.nameAm?.trim(), nameEn: req.body.nameEn?.trim(),
        roleAm: req.body.roleAm?.trim(), roleEn: req.body.roleEn?.trim(),
        badgeAm: req.body.badgeAm?.trim() || null, badgeEn: req.body.badgeEn?.trim() || null,
        team: req.body.team?.trim() || null, phone: req.body.phone?.trim() || null,
        email: req.body.email?.trim() || null, imagePath,
      },
    });
    return res.json({ ...updated, photo: await signedPhoto(updated.imagePath) });
  } catch {
    return res.status(500).json({ message: 'Unable to update administrator' });
  }
});

export default router;