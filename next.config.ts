import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const isProduction = process.env.NODE_ENV === 'production';

/**
 * ترويسات أمان دائمة (دفاع عميق أولي).
 * X-Frame-Options تبقى للمتصفحات القديمة؛ CSP frame-ancestors هي المرجع الحديث.
 */
const baseSecurityHeaders = [
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
  {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
  {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
  {key: 'X-DNS-Prefetch-Control', value: 'on'}
];

/**
 * سياسة أمن المحتوى (CSP) — تُفعَّل في الإنتاج فقط:
 * وضع التطوير (Turbopack HMR) يحتاج eval/websockets فتقييده يكسر الإقلاع.
 * السياسة pragmatique عمداً: Next يحقن سكربتات hydration مضمّنة، لذا
 * 'unsafe-inline' في script-src شرط تشغيل حتى دعم nonce كامل لاحقاً —
 * ومع ذلك تظل تحجب النطاقات الخارجية وobject/iframe/embed بالكامل.
 */
const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests'
].join('; ');

const productionOnlyHeaders = isProduction
  ? [
      // HTTPS صارم — المنصة تُطلق خلف TLS دائماً (سنة كاملة + preload)
      {key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload'},
      {key: 'Content-Security-Policy', value: PRODUCTION_CSP}
    ]
  : [];

/**
 * ترويسات ملفات /uploads المرافوعة:
 *  - immutable بلا حدود: الأسماء UUID عشوائية والمحتوى لا يتغير أبداً (أداء).
 *  - nosniff مكرَّر قصداً + CSP معزولة تماماً: حتى لو تسلّل ملف مسموم
 *    يوماً (شبه مستحيل بعد إعادة ترميز sharp الإجبارية) لن يُنفَّذ كمستند.
 */
const uploadsHeaders = [
  {key: 'Cache-Control', value: 'public, max-age=31536000, immutable'},
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'Content-Security-Policy', value: "default-src 'none'; sandbox"}
];

const nextConfig: NextConfig = {
  // بناء standalone جاهز للإنتاج (Docker/self-hosting)
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {source: '/uploads/:path*', headers: uploadsHeaders},
      {source: '/:path*', headers: [...baseSecurityHeaders, ...productionOnlyHeaders]}
    ];
  }
};

export default withNextIntl(nextConfig);
