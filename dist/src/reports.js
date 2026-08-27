import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import prisma from './prisma.js';
import { requireAuth } from './auth.js';
const router = Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'reports';
if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const allowedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, callback) => {
        callback(null, allowedMimeTypes.has(file.mimetype));
    },
    limits: { files: 10, fileSize: 10 * 1024 * 1024 },
});
function createReference() {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    return `HZ-RPT-${year}-${randomNumber}`;
}
function parseDate(value) {
    if (typeof value !== 'string')
        return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}
router.post('/', requireAuth, upload.array('files', 10), async (req, res) => {
    const files = req.files;
    const { reportType, fullName, empId, office, position, periodStart, periodEnd, notes, } = req.body;
    const startDate = parseDate(periodStart);
    const endDate = parseDate(periodEnd);
    if (!req.userId ||
        !['weekly', 'monthly', 'custom'].includes(reportType) ||
        !fullName?.trim() ||
        !empId?.trim() ||
        !office?.trim() ||
        !position?.trim() ||
        !startDate ||
        !endDate ||
        endDate < startDate ||
        !files?.length) {
        return res.status(400).json({ message: 'Complete report details and at least one PDF, image, or Word document are required' });
    }
    try {
        const reference = createReference();
        const uploadedFiles = [];
        for (const file of files) {
            const storagePath = `reports/${req.userId}/${reference}/${randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
            const { error } = await supabase.storage
                .from(storageBucket)
                .upload(storagePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });
            if (error) {
                const uploadedPaths = uploadedFiles.map((uploadedFile) => uploadedFile.path);
                if (uploadedPaths.length) {
                    await supabase.storage.from(storageBucket).remove(uploadedPaths);
                }
                return res.status(502).json({ message: 'Unable to upload report file' });
            }
            uploadedFiles.push({
                originalName: file.originalname,
                storedName: storagePath,
                mimeType: file.mimetype,
                size: file.size,
                path: storagePath,
            });
        }
        const report = await prisma.report.create({
            data: {
                reference,
                reportType,
                fullName: fullName.trim(),
                employeeId: empId.trim(),
                office: office.trim(),
                position: position.trim(),
                periodStart: startDate,
                periodEnd: endDate,
                notes: notes?.trim() || null,
                user: { connect: { id: req.userId } },
                files: {
                    create: uploadedFiles,
                },
            },
            select: { reference: true },
        });
        return res.status(201).json(report);
    }
    catch {
        return res.status(500).json({ message: 'Unable to submit report' });
    }
});
export default router;
