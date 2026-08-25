import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import prisma from './prisma.js';

const router = Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_PICTURES_BUCKET || 'pictures';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const administrators = await prisma.administrator.findMany({
      orderBy: [{ isLeader: 'desc' }, { nameEn: 'asc' }],
    });

    const result = await Promise.all(administrators.map(async (administrator) => {
      const { data, error } = await supabase.storage
        .from(storageBucket)
        .createSignedUrl(administrator.imagePath, 60 * 60);

      return { ...administrator, photo: error ? null : data.signedUrl };
    }));

    return res.json(result);
  } catch {
    return res.status(500).json({ message: 'Unable to load administrators' });
  }
});

export default router;