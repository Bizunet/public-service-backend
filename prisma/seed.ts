import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import prisma from '../src/prisma.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_PICTURES_BUCKET || 'pictures';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const frontendAssets = path.resolve('../hadiya-react/public/assets/admins');

const administrators = [
  { key: 'leader', nameAm: 'አቶ ህንዴቦ ጋልቻሞ ጋዕኖሬ', nameEn: 'Mr. Handebo Galichamo Gaenore', roleEn: 'Head, Hadiya Zone Public Service & Human Resource Development Department', roleAm: 'የሀድያ ዞን ፐብሊክ ሰርቪስና የሰዉ ሀብት ልማት መምርያ ሀላፊ', badgeEn: 'Department Head', badgeAm: 'የመምሪያው ኃላፊ', team: null, image: 'handebo.jpg', phone: null, email: 'galichamoh@gmail.com', isLeader: true },
  { key: 'getachew', nameAm: 'አቶ ጌታቸዉ ዋጡሞ ጋቦሬ', nameEn: 'Mr. Getachew Watumo Gabore', roleEn: 'Good Governance Affairs Team Leader', roleAm: 'የመልካም አስተዳደር ጉዳዮች ቡድን መሪ', badgeEn: 'Good Governance', badgeAm: 'መልካም አስተዳደር', team: 'governance', image: 'getachew.jpg', phone: '+251991326608', email: null, isLeader: false },
  { key: 'tamrat', nameAm: 'አቶ ታምራት አብቼ', nameEn: 'Mr. Tamrat Abiche', roleEn: 'Good Governance Affairs Expert', roleAm: 'የመልካም አስተዳደር ጉዳዮች ቡድን ባለሙያ', badgeEn: 'Good Governance', badgeAm: 'መልካም አስተዳደር', team: 'governance', image: 'tamrat.jpg', phone: '+251911540694', email: null, isLeader: false },
  { key: 'tadese', nameAm: 'አቶ ታደሰ ሻንቆ ጎዲሶ', nameEn: 'Mr. Tadese Shanko Godiso', roleEn: 'P/B/P/F Evaluation Team Leader', roleAm: 'የዕ/በ/ዝ/ክ/ግምገማ ቡድን መሪ', badgeEn: 'P/B/P/F Evaluation', badgeAm: 'ዕ/በ/ዝ/ክ/ግምገማ', team: 'evaluation', image: 'tadese.jpg', phone: null, email: 'tadessegodiso@gmail.com', isLeader: false },
  { key: 'dawit', nameAm: 'አቶ ዳዊት ላቀዉ', nameEn: 'Mr. Dawit Lakew', roleEn: 'P/B/P/F Evaluation Team Expert', roleAm: 'የዕ/በ/ዝ/ክ/ግምገማ ቡድን ባለሙያ', badgeEn: 'P/B/P/F Evaluation', badgeAm: 'ዕ/በ/ዝ/ክ/ግምገማ', team: 'evaluation', image: 'dawit.jpg', phone: null, email: null, isLeader: false },
  { key: 'liyuwerk', nameAm: 'ወ/ሪት ልዩወርቅ መኩሪያ ጸሐይ', nameEn: 'Ms. Liyuwerk Mekurya Tsehay', roleEn: 'HIV/AIDS Affairs Expert', roleAm: 'የኤች.አይ.ቪ.ኤዲስ ጉዳዮች ባለሙያ', badgeEn: 'HIV/AIDS Affairs', badgeAm: 'ኤች.አይ.ቪ.ኤዲስ', team: 'hiv', image: 'liyuwerk.jpg', phone: '0912244854', email: null, isLeader: false },
  { key: 'teshome', nameAm: 'አቶ ተሾመ ታምሬ ባሶሬ', nameEn: 'Mr. Teshome Tamire Basore', roleEn: 'Human Resource Administration & Development Team Leader', roleAm: 'የሰዉ ሀብት አስተዳደርና ልማት ቡድን መሪ', badgeEn: 'Human Resources', badgeAm: 'የሰዉ ሀብት', team: 'hr', image: 'teshome.jpg', phone: '+251926494655', email: 'Tamireteshome530@gmail.com', isLeader: false },
  { key: 'kassahun', nameAm: 'አቶ ካሳሁን ኤርማኮ', nameEn: 'Mr. Kassahun Ermako', roleEn: 'Human Resource Execution & Performance Team Leader', roleAm: 'የሰዉ ሀብት ሥ/አፈ/ግ/ግ/ቡድን መሪ', badgeEn: 'Human Resources', badgeAm: 'የሰዉ ሀብት', team: 'hr', image: 'kassahun.jpg', phone: '+251913747108', email: null, isLeader: false },
  { key: 'girma', nameAm: 'አቶ ግርማ መኔዶ', nameEn: 'Mr. Girma Menedo', roleEn: 'Reform Monitoring and Support Team', roleAm: 'የሪፎርም ክትትልና ድጋፍ ቡድን', badgeEn: 'Reform Monitoring', badgeAm: 'ሪፎርም ክትትል', team: 'reform', image: 'girma.jpg', phone: null, email: null, isLeader: false },
];

for (const administrator of administrators) {
  const { image, ...administratorData } = administrator;
  const imagePath = `administrators/${administrator.key}${path.extname(administrator.image).toLowerCase()}`;
  const imageBuffer = await readFile(path.join(frontendAssets, image));
  const { error } = await supabase.storage.from(storageBucket).upload(imagePath, imageBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) throw error;

  await prisma.administrator.upsert({
    where: { key: administrator.key },
    update: { ...administratorData, imagePath },
    create: { ...administratorData, imagePath },
  });
}

await prisma.$disconnect();
console.log(`Seeded ${administrators.length} administrators and uploaded their images.`);
