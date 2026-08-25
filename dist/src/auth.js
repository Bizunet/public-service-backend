import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './prisma.js';
const router = Router();
export async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
        ? authorization.slice(7)
        : undefined;
    if (!token) {
        return res.status(401).json({ message: 'Authentication is required' });
    }
    try {
        const payload = jwt.verify(token, getJwtSecret());
        if (typeof payload === 'string' || typeof payload.userId !== 'number') {
            return res.status(401).json({ message: 'Invalid authentication token' });
        }
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, role: true },
        });
        if (!user)
            return res.status(401).json({ message: 'User no longer exists' });
        req.userId = user.id;
        req.userRole = user.role;
        return next();
    }
    catch {
        return res.status(401).json({ message: 'Invalid or expired authentication token' });
    }
}
export function requireAdmin(req, res, next) {
    return requireAuth(req, res, () => {
        if (req.userRole !== 'ADMIN') {
            return res.status(403).json({ message: 'Administrator access is required' });
        }
        return next();
    });
}
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    return secret;
}
function createToken(userId) {
    return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '1d' });
}
router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, employeeId, password } = req.body;
        if (!fullName || !email || !employeeId || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { employeeId }],
            },
        });
        if (existingUser) {
            return res.status(409).json({
                message: 'Email or employee ID is already registered',
            });
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                name: fullName,
                email,
                employeeId,
                password: passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                employeeId: true,
                role: true,
            },
        });
        return res.status(201).json({
            user,
            token: createToken(user.id),
        });
    }
    catch {
        return res.status(500).json({ message: 'Unable to create account' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { employeeId, password } = req.body;
        if (!employeeId || !password) {
            return res.status(400).json({
                message: 'Employee ID and password are required',
            });
        }
        const user = await prisma.user.findUnique({
            where: { employeeId },
        });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                employeeId: user.employeeId,
                role: user.role,
            },
            token: createToken(user.id),
        });
    }
    catch {
        return res.status(500).json({ message: 'Unable to log in' });
    }
});
export default router;
