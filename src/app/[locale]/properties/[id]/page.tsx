import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations} from 'next-intl/server';
import {notFound, redirect} from 'next/navigation';
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Building2,
  Calendar,
  Check,
  Eye,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
  Users
} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {localizedPath, toAppLocale} from '@/i18n/locale';
import {routing} from '@/i18n/routing';
import {maskDzPhone} from '@/lib/auth/phone';
import {getSessionUserOrNull} from '@/lib/auth/session';
import {prisma} from '@/lib/prisma';
import {seasonalFeaturesSchema} from '@/lib/properties/schemas';
import {formatDzd} from '@/lib/utils';

/**
 * صفحة العقار — عرض المالك فقط (دخل منزلة المرحلة 6 لخدمة «عرض العقار» في اللوحة).
 *   - ليست صفحة تصفح عامة: التصفح الحر للمشترين يناقض نموذج المطابقة الأعمى.
 *   - غير المالك (وغير Admin) ⇒ 404 (لا تأكيد وجود أصلاً).
 *   - secretMin لا يُنتقى من DB أصلاً (select صريح) — لا احتمال تسريب.
 *   - ownerPhone يُقنَّع دائماً حتى لصاحبه (العادة الأمنية المطلقة).
 * ديناميكية + noindex.
 */
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{locale: string; id: string}>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {robots: {index: false, follow: false}};
}

export default async function PropertyPage({params}: Props) {
  const {locale: rawLocale, id} = await params;
  if (!hasLocale(routing.locales, rawLocale)) {
    notFound();
  }
  const locale = toAppLocale(rawLocale);

  const session = await getSessionUserOrNull();
  if (!session) {
    // يحافظ على لغة الوجهة بعد الدخول (#/fr يستحق العودة إلى /fr/…)
    const returnTo = localizedPath(`/properties/${id}`, locale);
    redirect(localizedPath(`/login?next=${encodeURIComponent(returnTo)}`, locale));
  }

  // select صريح حقل-بحقل: أي سِرّية لا تُقرأ من القاعدة أصلاً
  const property = await prisma.property.findUnique({
    where: {id},
    select: {
      id: true,
      sellerId: true,
      transactionType: true,
      propertyType: true,
      condition: true,
      status: true,
      accountType: true,
      legalStatus: true,
      ownerName: true,
      ownerPhone: true,
      wilaya: {select: {code: true, nameAr: true, nameFr: true}},
      commune: {select: {id: true, nameAr: true, nameFr: true}},
      neighborhood: true,
      titleAr: true,
      description: true,
      areaM2: true,
      rooms: true,
      bathrooms: true,
      floor: true,
      totalFloors: true,
      facades: true,
      furnished: true,
      hasParking: true,
      hasElevator: true,
      hasGarden: true,
      seasonalFeatures: true,
      askingPrice: true,
      currency: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      images: {orderBy: {sortOrder: 'asc'}}
    }
  });

  // غير موجود أو ليس لك ⇒ 404 صامت (ولا إشارة عن الوجود)
  if (!property || (property.sellerId !== session.user.id && session.user.role !== 'admin')) {
    notFound();
  }

  const t = await getTranslations('dashboard.details');
  const tTypes = await getTranslations('publish.types');
  const tFields = await getTranslations('publish.fields');
  const isAr = locale === 'ar';
  const dateFmt = new Intl.DateTimeFormat(isAr ? 'ar-DZ' : 'fr-DZ', {dateStyle: 'long'});
  const numberFmt = new Intl.NumberFormat(isAr ? 'ar-DZ' : 'fr-DZ');

  const features = [
    property.furnished === true ? tFields('furnished') : null,
    property.hasParking === true ? tFields('hasParking') : null,
    property.hasElevator === true ? tFields('hasElevator') : null,
    property.hasGarden === true ? tFields('hasGarden') : null
  ].filter((f): f is string => f !== null);

  const seasonal = seasonalFeaturesSchema.safeParse(property.seasonalFeatures);
  const seasonalBooleans = seasonal.success
    ? ([
        seasonal.data.airConditioning === true ? tFields('airConditioning') : null,
        seasonal.data.pool === true ? tFields('pool') : null,
        seasonal.data.seaView === true ? tFields('seaView') : null,
        seasonal.data.wifi === true ? tFields('wifi') : null
      ].filter((f): f is string => f !== null))
    : [];

  type Spec = {readonly icon: React.ReactNode; readonly label: string; readonly value: string};
  const specs: Spec[] = [];
  if (property.areaM2 !== null) {
    specs.push({
      icon: <Ruler className="size-4 text-gold-600" aria-hidden="true" />,
      label: t('areaM2'),
      value: `${numberFmt.format(property.areaM2)} م²`
    });
  }
  if (property.rooms !== null) {
    specs.push({
      icon: <BedDouble className="size-4 text-gold-600" aria-hidden="true" />,
      label: t('rooms'),
      value: numberFmt.format(property.rooms)
    });
  }
  if (property.bathrooms !== null) {
    specs.push({
      icon: <Bath className="size-4 text-gold-600" aria-hidden="true" />,
      label: t('bathrooms'),
      value: numberFmt.format(property.bathrooms)
    });
  }
  if (property.floor !== null) {
    specs.push({
      icon: <Building2 className="size-4 text-gold-600" aria-hidden="true" />,
      label: t('floor'),
      value: numberFmt.format(property.floor)
    });
  }
  if (property.totalFloors !== null) {
    specs.push({
      icon: <Building2 className="size-4 text-gold-600" aria-hidden="true" />,
      label: t('totalFloors'),
      value: numberFmt.format(property.totalFloors)
    });
  }
  if (property.facades !== null) {
    specs.push({
      icon: <Building2 className="size-4 text-gold-600" aria-hidden="true" />,
      label: t('facades'),
      value: numberFmt.format(property.facades)
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
        {t('back')}
      </Link>

      {/* الترويسة */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-extrabold text-gold-300">
              {tTypes(`deal.${property.transactionType}`)}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-navy-800">
              {tTypes(`property.${property.propertyType}`)}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-navy-800">
              {tTypes(`condition.${property.condition}`)}
            </span>
            {property.legalStatus ? (
              <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-800">
                {tTypes(`legal.${property.legalStatus}`)}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-navy-900 sm:text-3xl">{property.titleAr}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <MapPin className="size-4 text-gold-600" aria-hidden="true" />
            {isAr ? property.wilaya.nameAr : property.wilaya.nameFr} —{' '}
            {isAr ? property.commune.nameAr : property.commune.nameFr}
            {property.neighborhood ? ` · ${property.neighborhood}` : ''}
          </p>
        </div>
        <p className="text-2xl font-black text-navy-900" dir="ltr">
          {formatDzd(Number(property.askingPrice), locale)}
        </p>
      </div>

      {/* الصور */}
      {property.images.length > 0 ? (
        <section className="mt-8">
          <h2 className="sr-only">{t('imagesTitle')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {property.images.map((image, index) => (
              // eslint-disable-next-line @next/next/no-img-element -- صور داخلية WebP مضغوطة من مسارنا
              <img
                key={image.id}
                src={image.url}
                alt={`${property.titleAr} — ${index + 1}`}
                width={image.width}
                height={image.height}
                loading={index === 0 ? 'eager' : 'lazy'}
                className={`w-full rounded-2xl border border-border object-cover ${
                  index === 0 ? 'aspect-16/10 sm:col-span-2' : 'aspect-16/10'
                }`}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* المواصفات */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {t('specsTitle')}
          </h2>
          {specs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">—</p>
          ) : (
            <dl className="mt-3 grid grid-cols-2 gap-3">
              {specs.map((spec) => (
                <div key={spec.label} className="rounded-xl bg-muted/50 px-4 py-3">
                  <dt className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    {spec.icon}
                    {spec.label}
                  </dt>
                  <dd className="mt-1 text-lg font-extrabold text-navy-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {features.length > 0 ? (
            <>
              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t('featuresTitle')}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1.5 text-xs font-extrabold text-gold-800"
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {seasonal.success ? (
            <>
              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t('seasonalTitle')}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                <li className="inline-flex items-center gap-1.5 rounded-full bg-navy-900/5 px-3 py-1.5 text-xs font-extrabold text-navy-800">
                  <Users className="size-3.5 text-gold-600" aria-hidden="true" />
                  {tFields('capacity')}: {numberFmt.format(seasonal.data.capacity)}
                </li>
                {seasonal.data.distanceToBeachM !== undefined ? (
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-navy-900/5 px-3 py-1.5 text-xs font-extrabold text-navy-800">
                    {tFields('distanceToBeachM')}: {numberFmt.format(seasonal.data.distanceToBeachM)}
                  </li>
                ) : null}
                {seasonalBooleans.map((feature) => (
                  <li
                    key={feature}
                    className="inline-flex items-center gap-1.5 rounded-full bg-navy-900/5 px-3 py-1.5 text-xs font-extrabold text-navy-800"
                  >
                    <Check className="size-3.5 text-gold-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        {/* الوصف + البيانات التشغيلية */}
        <div className="space-y-4">
          {property.description ? (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t('descriptionTitle')}
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-navy-900">
                {property.description}
              </p>
            </section>
          ) : null}

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                  <Eye className="size-4 text-gold-600" aria-hidden="true" />
                  {t('viewsLabel')}
                </dt>
                <dd className="font-extrabold text-navy-900">{numberFmt.format(property.views)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                  <Calendar className="size-4 text-gold-600" aria-hidden="true" />
                  {t('publishedOn')}
                </dt>
                <dd className="font-extrabold text-navy-900">{dateFmt.format(property.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                  <Calendar className="size-4 text-gold-600" aria-hidden="true" />
                  {t('lastUpdated')}
                </dt>
                <dd className="font-extrabold text-navy-900">{dateFmt.format(property.updatedAt)}</dd>
              </div>
              {property.ownerPhone ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                    <Phone className="size-4 text-gold-600" aria-hidden="true" />
                    {t('ownerPhoneLabel')}
                  </dt>
                  <dd className="font-extrabold text-navy-900" dir="ltr">
                    {maskDzPhone(property.ownerPhone)}
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">{t('maskedPhoneHint')}</p>
          </section>

          <p className="flex items-start gap-2 rounded-2xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm font-semibold leading-7 text-gold-800">
            <ShieldCheck className="mt-1 size-4 shrink-0" aria-hidden="true" />
            {t('secretNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
