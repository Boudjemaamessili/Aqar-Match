/**
 * حقن Schema.org (JSON-LD) — مكوّن خادم يدفع الكائن كما هو.
 * التعقيم: تعويض كل «<» بترميزها اليونيكودي (باكسلاش+u003c) يمنع كسر الوسم
 * script مبكراً حتى مع محتوى مستقبلي غير منسّق (اليوم: منسّق 100%).
 */
import type {JsonLdObject} from '@/lib/seo/jsonld';

export function JsonLd({data}: {readonly data: JsonLdObject}) {
  const safeJson = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: safeJson}}
    />
  );
}
