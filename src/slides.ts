import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import prisma from './prisma.js';
import { requireAdmin, type AuthenticatedRequest } from './auth.js';

const router = Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_PICTURES_BUCKET || 'pictures';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

async function signedImage(imagePath: string) {
  const { data } = await supabase.storage.from(storageBucket).createSignedUrl(imagePath, 3600);
  return data?.signedUrl || null;
}

function isSupportedImage(mimetype: string) {
  return ['image/jpeg', 'image/png'].includes(mimetype);
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseOrder(value: unknown, fallback = 0) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseBoolean(value: unknown, fallback: boolean) {
  if (value === undefined || value === '') return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return res.json(await Promise.all(slides.map(async (slide) => ({
      ...slide,
      imageUrl: await signedImage(slide.imagePath),
    }))));
  } catch {
    return res.status(500).json({ message: 'Unable to load slides' });
  }
});

router.post('/', requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  const image = req.file;
  if (!image) return res.status(400).json({ message: 'An image is required' });
  if (!isSupportedImage(image.mimetype)) {
    return res.status(400).json({ message: 'Only JPG and PNG images are allowed' });
  }

  const order = parseOrder(req.body.order);
  const isActive = parseBoolean(req.body.isActive, true);
  if (order === null || isActive === null) {
    return res.status(400).json({ message: 'Invalid order or active status' });
  }

  const extension = path.extname(image.originalname).toLowerCase() || (image.mimetype === 'image/png' ? '.png' : '.jpg');
  const imagePath = `slides/${randomUUID()}${extension}`;

  try {
    const { error } = await supabase.storage.from(storageBucket).upload(imagePath, image.buffer, {
      contentType: image.mimetype,
      upsert: false,
    });
    if (error) return res.status(502).json({ message: 'Unable to upload slide image' });

    const slide = await prisma.heroSlide.create({
      data: {
        imagePath,
        captionEn: optionalText(req.body.captionEn),
        captionAm: optionalText(req.body.captionAm),
        linkTo: optionalText(req.body.linkTo),
        order,
        isActive,
      },
    });

    return res.status(201).json({ ...slide, imageUrl: await signedImage(slide.imagePath) });
  } catch {
    return res.status(500).json({ message: 'Unable to create slide' });
  }
});

router.put('/:id', requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid slide id' });

  try {
    const current = await prisma.heroSlide.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ message: 'Slide not found' });

    const order = parseOrder(req.body.order, current.order);
    const isActive = parseBoolean(req.body.isActive, current.isActive);
    if (order === null || isActive === null) {
      return res.status(400).json({ message: 'Invalid order or active status' });
    }

    let imagePath = current.imagePath;
    const image = req.file;
    if (image) {
      if (!isSupportedImage(image.mimetype)) {
        return res.status(400).json({ message: 'Only JPG and PNG images are allowed' });
      }
      const extension = path.extname(image.originalname).toLowerCase() || (image.mimetype === 'image/png' ? '.png' : '.jpg');
      imagePath = `slides/${randomUUID()}${extension}`;
      const { error } = await supabase.storage.from(storageBucket).upload(imagePath, image.buffer, {
        contentType: image.mimetype,
        upsert: false,
      });
      if (error) return res.status(502).json({ message: 'Unable to upload slide image' });
    }

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        imagePath,
        captionEn: req.body.captionEn === undefined ? current.captionEn : optionalText(req.body.captionEn),
        captionAm: req.body.captionAm === undefined ? current.captionAm : optionalText(req.body.captionAm),
        linkTo: req.body.linkTo === undefined ? current.linkTo : optionalText(req.body.linkTo),
        order,
        isActive,
      },
    });

    return res.json({ ...slide, imageUrl: await signedImage(slide.imagePath) });
  } catch {
    return res.status(500).json({ message: 'Unable to update slide' });
  }
});

router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid slide id' });

  try {
    const slide = await prisma.heroSlide.findUnique({ where: { id } });
    if (!slide) return res.status(404).json({ message: 'Slide not found' });

    await prisma.heroSlide.delete({ where: { id } });
    await supabase.storage.from(storageBucket).remove([slide.imagePath]);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: 'Unable to delete slide' });
  }
});

export default router;
