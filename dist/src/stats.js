import { Router } from 'express';
import prisma from './prisma.js';
import { requireAdmin } from './auth.js';
const router = Router();
router.get('/public', async (_req, res) => {
    try {
        const [totalEmployees, totalReports] = await Promise.all([
            prisma.user.count(),
            prisma.report.count(),
        ]);
        return res.json({ totalEmployees, totalReports });
    }
    catch {
        return res.status(500).json({ message: 'Unable to load public statistics' });
    }
});
router.get('/admin', requireAdmin, async (_req, res) => {
    try {
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const [totalReports, totalEmployees, totalContactMessages, totalAnnouncements, reportsLast30Days, reportsByType, reportsByOffice, recentReports,] = await Promise.all([
            prisma.report.count(),
            prisma.user.count(),
            prisma.contactMessage.count(),
            prisma.announcement.count(),
            prisma.report.count({ where: { createdAt: { gte: since } } }),
            prisma.report.groupBy({ by: ['reportType'], _count: true }),
            prisma.report.groupBy({ by: ['office'], _count: true }),
            prisma.report.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { reference: true, fullName: true, office: true, createdAt: true },
            }),
        ]);
        return res.json({
            totalReports,
            totalEmployees,
            totalContactMessages,
            totalAnnouncements,
            reportsLast30Days,
            reportsByType: reportsByType.map(({ reportType, _count }) => ({
                reportType,
                count: _count,
            })),
            reportsByOffice: reportsByOffice.map(({ office, _count }) => ({
                office,
                count: _count,
            })),
            recentReports,
        });
    }
    catch {
        return res.status(500).json({ message: 'Unable to load admin statistics' });
    }
});
export default router;
