import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import prisma from './prisma.js';
import { requireAuth, requireAdmin } from './auth.js';
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
router.get('/admin', requireAdmin, async (_req, res) => {
    try {
        const reports = await prisma.report.findMany({ include: { files: true }, orderBy: { createdAt: 'desc' } });
        return res.json(reports);
    }
    catch {
        return res.status(500).json({ message: 'Unable to load reports' });
    }
});
router.patch('/admin/:id/status', requireAdmin, async (req, res) => {
    const status = ['Pending', 'Reviewed', 'Approved'].includes(req.body.status) ? req.body.status : null;
    if (!status)
        return res.status(400).json({ message: 'Invalid report status' });
    try {
        return res.json(await prisma.report.update({ where: { id: Number(req.params.id) }, data: { status } }));
    }
    catch {
        return res.status(404).json({ message: 'Report not found' });
    }
});
router.delete('/admin/:id', requireAdmin, async (req, res) => {
    const reportId = Number(req.params.id);
    if (!Number.isInteger(reportId)) {
        return res.status(400).json({ message: 'Invalid report id' });
    }
    try {
        const report = await prisma.report.findUnique({ where: { id: reportId }, include: { files: true } });
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        const storagePaths = report.files.map((file) => file.path).filter(Boolean);
        if (storagePaths.length) {
            const { error } = await supabase.storage.from(storageBucket).remove(storagePaths);
            if (error) {
                return res.status(502).json({ message: 'Unable to delete report files from storage' });
            }
        }
        await prisma.report.delete({ where: { id: reportId } });
        return res.json({ message: 'Report deleted successfully' });
    }
    catch {
        return res.status(500).json({ message: 'Unable to delete report' });
    }
});
router.get('/admin/files/:id/download', requireAdmin, async (req, res) => {
    const fileId = Number(req.params.id);
    if (!Number.isInteger(fileId)) {
        return res.status(400).json({ message: 'Invalid file id' });
    }
    try {
        const file = await prisma.reportFile.findUnique({ where: { id: fileId } });
        if (!file)
            return res.status(404).json({ message: 'File not found' });
        const { data: fileData, error: fileError } = await supabase.storage
            .from(storageBucket)
            .download(file.path);
        if (!fileError && fileData) {
            const buffer = Buffer.from(await fileData.arrayBuffer());
            res.setHeader('Content-Type', file.mimeType || fileData.type || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
            res.setHeader('Content-Length', buffer.length);
            return res.send(buffer);
        }
        const { data: signedData, error: signedError } = await supabase.storage
            .from(storageBucket)
            .createSignedUrl(file.path, 60 * 10);
        if (!signedError && signedData?.signedUrl) {
            return res.json({ url: signedData.signedUrl, name: file.originalName });
        }
        return res.status(502).json({ message: fileError?.message || signedError?.message || 'Unable to prepare download' });
    }
    catch {
        return res.status(500).json({ message: 'Unable to prepare download' });
    }
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
