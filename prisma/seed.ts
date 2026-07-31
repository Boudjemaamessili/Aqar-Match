/**
 * بذر قاعدة البيانات — عقار Match
 * يملأ: الولايات السبع النشطة + جميع بلدياتها الرسمية (256).
 * آمن للتكرار (idempotent) عبر upsert بمعرفات ثابتة.
 */
import {PrismaClient} from '@prisma/client';
import {ACTIVE_WILAYAS} from '../src/lib/geo/wilayas';
import {COMMUNES} from '../src/lib/geo/communes';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log(`🌱 بذر ${ACTIVE_WILAYAS.length} ولايات نشطة...`);
  for (const w of ACTIVE_WILAYAS) {
    await prisma.wilaya.upsert({
      where: {code: w.code},
      update: {slug: w.slug, nameAr: w.nameAr, nameFr: w.nameFr, isActive: true},
      create: {code: w.code, slug: w.slug, nameAr: w.nameAr, nameFr: w.nameFr, isActive: true}
    });
  }

  console.log(`🌱 بذر ${COMMUNES.length} بلدية...`);
  for (const c of COMMUNES) {
    await prisma.commune.upsert({
      where: {id: c.id},
      update: {
        wilayaCode: c.wilayaCode,
        slug: c.slug,
        nameAr: c.nameAr,
        nameFr: c.nameFr,
        dairaAr: c.dairaAr,
        dairaFr: c.dairaFr
      },
      create: {
        id: c.id,
        wilayaCode: c.wilayaCode,
        slug: c.slug,
        nameAr: c.nameAr,
        nameFr: c.nameFr,
        dairaAr: c.dairaAr,
        dairaFr: c.dairaFr
      }
    });
  }

  console.log('✅ اكتمل البذر بنجاح');
}

main()
  .catch((error: unknown) => {
    console.error('❌ فشل البذر:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
