import { Router } from 'express';
import prisma from './prisma.js';
const router = Router();
function createReference() {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    return `HZ-MSG-${year}-${randomNumber}`;
}
router.post('/', async (req, res) => {
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
    }
    catch {
        return res.status(500).json({ message: 'Unable to send message' });
    }
});
export default router;
