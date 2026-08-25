import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/prisma.js';
const employeeId = process.env.ADMIN_EMPLOYEE_ID;
const password = process.env.ADMIN_PASSWORD;
const email = process.env.ADMIN_EMAIL;
const name = process.env.ADMIN_NAME || 'Site Administrator';
if (!employeeId || !password || !email) {
    throw new Error('Set ADMIN_EMPLOYEE_ID, ADMIN_PASSWORD, and ADMIN_EMAIL before running this command');
}
const passwordHash = await bcrypt.hash(password, 12);
await prisma.user.upsert({
    where: { employeeId },
    update: { name, email, password: passwordHash, role: 'ADMIN' },
    create: { name, email, employeeId, password: passwordHash, role: 'ADMIN' },
});
await prisma.$disconnect();
console.log(`Administrator account ready for ${employeeId}`);
