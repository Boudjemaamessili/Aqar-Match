/**
 * مولّد بيانات الولايات والبلديات — عقار Match
 * ─────────────────────────────────────────────
 * المصدر الخام: scripts/vendor/algeria_cities.json
 *   (رخصة MIT — https://github.com/othmanus/algeria-cities)
 *
 * يُنتج: src/lib/geo/communes.ts  (ملف مُولَّد — لا تعدّله يدوياً)
 *
 * التصحيحات الفرنسية: الأسماء الخام ASCII وتنحرف أحياناً عن الرسمي
 * الفرنسي المعتمد (Toponymie). كل تصحيح موثّق في FR_OVERRIDES أدناه —
 * هذا الملف هو المصدر الوحيد لأي تصحيح مستقبلي.
 *
 * التشغيل: npm run data:geo
 */
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** الولايات السبع النشطة في الإطلاق الأول */
const ACTIVE_WILAYA_CODES = ['16', '09', '26', '31', '19', '25', '23'];

/** العدد الرسمي للبلديات لكل ولاية (Journal Officiel) — فحص سلامة إلزامي */
const EXPECTED_COUNTS = {'16': 57, '09': 25, '26': 64, '31': 26, '19': 60, '25': 12, '23': 12};

/**
 * خريطة التصحيحات: "wilayaCode:RawAsciiName" → الاسم الفرنسي الرسمي.
 * لا تُضاف أي مدخلة إلا بيقين تام؛ غير الموثوق يُترك كما هو.
 */
const FR_OVERRIDES = new Map(Object.entries({
  // 16 — Alger
  '16:Douira': 'Douéra',
  '16:Sehaoula': 'Saoula',
  '16:Maalma': 'Mahelma',
  '16:Herraoua': "H'raoua",
  '16:Mohamed Belouzdad': 'Belouizdad',
  '16:Bachedjerah': 'Bachdjerrah',
  '16:Bouzareah': 'Bouzaréah',
  '16:Zeralda': 'Zéralda',
  '16:Staoueli': 'Staouéli',
  '16:Reghaia': 'Reghaïa',
  '16:Rouiba': 'Rouïba',
  '16:Cheraga': 'Chéraga',
  '16:Hammamet': 'El Hammamet',
  '16:Bologhine Ibnou Ziri': 'Bologhine',
  '16:Rais Hamidou': 'Raïs Hamidou',
  '16:Bir Mourad Rais': 'Bir Mourad Raïs',
  '16:Khraissia': 'Khraicia',
  "16:Sidi M'hamed": "Sidi M'Hamed",
  // 09 — Blida
  '09:Beni-Tamou': 'Beni Tamou',
  '09:Benkhelil': 'Ben Khelil',
  '09:Chebli': 'Chébli',
  '09:Chrea': 'Chréa',
  '09:El-Affroun': 'El Affroun',
  '09:Guerrouaou': 'Guerouaou',
  '09:Hammam Elouane': 'Hammam Melouane',
  '09:Larbaa': 'Larbaâ',
  '09:Mouzaia': 'Mouzaïa',
  '09:Oued  Djer': 'Oued Djer',
  '09:Ouled Yaich': 'Ouled Yaïch',
  '09:Soumaa': 'Soumaâ',
  // 26 — Médéa
  '26:Aissaouia': 'Aïssaouia',
  '26:Chelalet El Adhaoura': 'Chellalat El Adhaoura',
  '26:El Guelbelkebir': 'El Guelbel Kebir',
  '26:Medea': 'Médéa',
  // 31 — Oran
  '31:Bousfer': 'Bou Sfer',
  '31:Boutlelis': 'Boutlélis',
  '31:El Ancor': 'El Ançor',
  '31:Es Senia': 'Es Sénia',
  '31:Mers El Kebir': 'Mers El Kébir',
  '31:Messerghin': 'Misserghin',
  // 19 — Sétif
  '19:Ain-Legradj': 'Aïn Legradj',
  '19:Ain-Roua': 'Aïn Roua',
  '19:Ain-Sebt': 'Aïn Sebt',
  '19:Ait-Tizi': 'Aït Tizi',
  '19:Bazer-Sakra': 'Bazer Sakhra',
  '19:Bir-El-Arch': 'Bir El Arch',
  '19:Draa-Kebila': 'Draa Kebila',
  '19:El-Ouldja': 'El Ouldja',
  '19:Serdj-El-Ghoul': 'Serdj El Ghoul',
  '19:Beni-Aziz': 'Beni Aziz',
  '19:Beni-Mouhli': 'Beni Mouhli',
  '19:Bougaa': 'Bougaâ',
  "19:Tizi N'bechar": "Tizi N'Béchar",
  '19:Setif': 'Sétif',
  '19:Tala-Ifacene': 'Tala Ifacene',
  '19:Hamam Soukhna': 'Hammam Soukhna',
  // 23 — Annaba
  '23:Chetaibi': 'Chétaïbi',
  '23:Seraidi': 'Séraïdi',
  '23:El Eulma': 'Eulma',
  // 25 — Constantine
  '25:Beni Hamidane': 'Beni Hamiden',
  '25:Ouled Rahmoun': 'Ouled Rahmoune',
  '25:Messaoud Boudjeriou': 'Messaoud Boudjriou'
}));

/** قاعدة عامة آمنة: «عين» تُكتب رسمياً Aïn */
function fixGenericPrefix(name) {
  return name.replace(/^Ain[\s-]+/, 'Aïn ');
}

/** slug لاتيني ثابت من الاسم الفرنسي */
function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveFrenchName(code, raw) {
  const exact = FR_OVERRIDES.get(`${code}:${raw}`);
  return exact ?? fixGenericPrefix(raw);
}

function main() {
  const raw = JSON.parse(readFileSync(join(ROOT, 'scripts/vendor/algeria_cities.json'), 'utf8'));

  const picked = raw
    .filter((c) => ACTIVE_WILAYA_CODES.includes(c.wilaya_code))
    .sort((a, b) => a.id - b.id);

  // فحوص سلامة الصناديق: العدد الرسمي + تفرّد id + تفرّد الـ slug داخل الولاية
  const perWilaya = new Map();
  const seenIds = new Set();
  const records = [];

  for (const c of picked) {
    if (seenIds.has(c.id)) throw new Error(`معرّف مكرر في المصدر: ${c.id}`);
    seenIds.add(c.id);

    const nameFr = resolveFrenchName(c.wilaya_code, c.commune_name_ascii);
    const record = {
      id: c.id,
      wilayaCode: Number.parseInt(c.wilaya_code, 10),
      slug: slugify(nameFr),
      nameAr: c.commune_name,
      nameFr,
      dairaAr: c.daira_name,
      dairaFr: c.daira_name_ascii
    };
    if (!record.slug || !record.nameAr) {
      throw new Error(`سجل ناقص: ${JSON.stringify(c)}`);
    }
    perWilaya.set(c.wilaya_code, (perWilaya.get(c.wilaya_code) ?? 0) + 1);
    records.push(record);
  }

  const slugSeen = new Set();
  for (const r of records) {
    const key = `${r.wilayaCode}:${r.slug}`;
    if (slugSeen.has(key)) throw new Error(`slug مكرر داخل الولاية: ${key}`);
    slugSeen.add(key);
  }

  const summary = [];
  for (const code of ACTIVE_WILAYA_CODES) {
    const count = perWilaya.get(code) ?? 0;
    const expected = EXPECTED_COUNTS[code];
    if (count !== expected) {
      throw new Error(`عدد بلديات الولاية ${code} هو ${count} والمتوقع رسمياً ${expected}`);
    }
    summary.push(`${code}=${count}`);
  }

  const body = records
    .map(
      (r) =>
        `  {id: ${r.id}, wilayaCode: ${r.wilayaCode}, slug: '${r.slug}', ` +
        `nameAr: '${r.nameAr.replace(/'/g, "\\'")}', nameFr: '${r.nameFr.replace(/'/g, "\\'")}', ` +
        `dairaAr: '${r.dairaAr.replace(/'/g, "\\'")}', dairaFr: '${r.dairaFr.replace(/'/g, "\\'")}'}`
    )
    .join(',\n');

  const out = `/**
 * ⚠️ ملف مُولَّد آلياً — لا تعدّله يدوياً.
 * لإعادة التوليد: npm run data:geo
 * المصدر: scripts/vendor/algeria_cities.json (MIT — othmanus/algeria-cities)
 * التصحيحات الفرنسية: scripts/generate-geo-data.mjs (FR_OVERRIDES)
 * البلديات: ${records.length} بلدية رسمية عبر ${ACTIVE_WILAYA_CODES.length} ولايات نشطة.
 */
export interface CommuneRecord {
  /** المعرف الرسمي العام (ثابت عبر إعادة التوليد) */
  readonly id: number;
  readonly wilayaCode: number;
  readonly slug: string;
  readonly nameAr: string;
  readonly nameFr: string;
  readonly dairaAr: string;
  readonly dairaFr: string;
}

export const COMMUNES = [
${body}
] as const satisfies readonly CommuneRecord[];
`;

  const target = join(ROOT, 'src/lib/geo/communes.ts');
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, out, 'utf8');

  console.log(`✅ تم توليد ${records.length} بلدية (${summary.join(' · ')})`);
  console.log(`→ ${target}`);
}

main();
