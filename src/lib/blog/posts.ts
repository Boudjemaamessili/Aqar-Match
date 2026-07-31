/**
 * محتوى المدونة المنسّق — مقالات تحريرية ثابتة ثنائية اللغة (نقي، client-safe).
 *
 * قرار تصميمي موثّق: المحتوى هنا (Typed Data) وليس في جدول BlogPost —
 *   1) المحتوى تحريري مستقر ولا يحتاج CMS في MVP؛
 *   2) SSG كامل بلا تبعية قاعدة/هجرة للصفحات العامة الأهم لـ SEO؛
 *   3) البنية تطابق حقول BlogPost (slug/category/tags/wilayaCode/seo*)
 *      لتسهيل الترحيل للجدول عندما يظهر محرر إداري (مرحلة مستقبلية).
 */
import type {AppLocale} from '@/i18n/locale';

// ─── البنية ──────────────────────────────────────────────────────────────────

export type BlogBlock =
  | {readonly type: 'p'; readonly text: string}
  | {readonly type: 'h2'; readonly text: string}
  | {readonly type: 'h3'; readonly text: string}
  | {readonly type: 'list'; readonly items: readonly string[]}
  | {readonly type: 'quote'; readonly text: string};

export interface BlogPostLocaleContent {
  readonly title: string;
  readonly excerpt: string;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly blocks: readonly BlogBlock[];
}

export interface BlogPostDefinition {
  /// سلاج لاتيني مشترك بين اللغتين (بساطة URL + hreflang ثنائي)
  readonly slug: string;
  readonly coverImageUrl: string | null;
  readonly publishedAt: string;
  readonly updatedAt: string;
  /// ربط ترويجي بصفحة هبوط ولاية (null = عام)
  readonly wilayaCode: number | null;
  readonly ar: BlogPostLocaleContent;
  readonly fr: BlogPostLocaleContent;
}

// ─── المقالات ────────────────────────────────────────────────────────────────

const GUIDE_ALGER: BlogPostDefinition = {
  slug: 'guide-achat-appartement-alger',
  coverImageUrl: '/blog/covers/alger-guide.jpg',
  publishedAt: '2026-07-12T09:00:00.000Z',
  updatedAt: '2026-07-12T09:00:00.000Z',
  wilayaCode: 16,
  ar: {
    title: 'دليل شراء شقة في الجزائر العاصمة — 2026',
    excerpt:
      'خطوات عملية من تحديد الميزانية إلى توقيع العقد الموثق: كيف تشتري شقتك في العاصمة بذكاء وتتجنب فخاخ السوق التقليدي.',
    seoTitle: 'شراء شقة بالجزائر العاصمة 2026 — الدليل الكامل خطوة بخطوة',
    seoDescription:
      'دليل عملي لشراء شقة في الجزائر العاصمة: الميزانية الحقيقية، اختيار البلدية والحي، الوثائق القانونية الإلزامية، وكيف توفر آلاف الدنانير بالتفاوض الأعمى.',
    category: 'أدلة الشراء',
    tags: ['شراء شقة', 'الجزائر العاصمة', 'وثائق عقارية', 'نصائح مشترين'],
    blocks: [
      {
        type: 'p',
        text: 'شراء شقة في العاصمة هو أكبر قرار مالي لمعظم العائلات الجزائرية، ومع ذلك ما يزال كثير من المشترين يدخلون السوق بلا خطة: ميزانية تقريبية، وثائق غير مفحوصة، وتفاوض مكشوف يكشف سقفهم للبائع منذ الدقيقة الأولى. هذا الدليل يرتّب العملية كما يمارسها المحترفون، خطوة بخطوة.'
      },
      {type: 'h2', text: '١) حدّد ميزانيتك «الحقيقية» لا المثالية'},
      {
        type: 'p',
        text: 'الخطأ الأشهر هو حساب سعر الشقة فقط. اجمع كل المصاريف قبل أن تعلن ميزانيتك لأي طرف:'
      },
      {
        type: 'list',
        items: [
          'سعر الشقة ذاته (المتغير الوحيد المرئي للجميع).',
          'مصاريف التوثيق والتسجيل (تُقدَّر عادة ببضع نقاط مئوية من السعر).',
          'مصاريف الوكالة أو المنصة إن وجدت — في عقار Match المشتري مجاني تماماً (0 دج).',
          'تهيئة وأثاث أولي: خصّص لهما مبلغاً صريحاً حتى لا تضطر لاقتراض لاحقاً.'
        ]
      },
      {type: 'h2', text: '٢) اختر البلدية بنمط حياتك لا بالسمعة العامة'},
      {
        type: 'p',
        text: 'حيدرة والأبيار وبن عكنون راقية لكن متر المربع فيها قد يشتري مترين في برج الكيفان أو عين البنيان. اسأل نفسك: أين أعمل؟ أين يدرس أبنائي؟ ما سقف وقت المواصلات الذي أتحمله يومياً؟ ضع 2–3 بلديات مرشحة وقائمة أحياء مفضلة داخلها — في محرك المطابقة يكفي ذكر الحي لترتفع درجة المطابقة المكانية تلقائياً.'
      },
      {type: 'h2', text: '٣) رتّب الوثائق قبل أي تفاوض'},
      {
        type: 'p',
        text: 'اطلب من البائع صورة الوثيقة الأصلية قبل أن تتقدم خطوة: عقد موثق أو دفتر عقاري هما الأقوى؛ وعد بالبيع أو قرار امتياز يقبلان مع تحقق إضافي؛ والعقد العرفي وحده يبقى مخاطرة يجب تسعيرها بصراحة أو تجنبها. العقود «قيد التسوية» شائعة في الترقيات العقارية — لا ترفضها آلياً لكن تحقق من ملف التسوية لدى البلدية.'
      },
      {type: 'h2', text: '٤) لا تكشف سقف ميزانيتك أبداً'},
      {
        type: 'p',
        text: 'في السوق التقليدي يجلس الوسيط بين يديك ويعرف سقفك وحد البائع الأدنى — فيتقاسم الفارق مع أحدهما أو كليهما. النموذج العمياء يقلب المعادلة: أنت تُدخل ميزانيتك القصوى بسرية، والبائع يُدخل حده الأدنى بسرية، والمحرك وحده يطابق العروض المتوافقة رياضياً. النتيجة: لا أحد يستطيع «قراءة» موقفك التفاوضي، والسعر النهائي أقرب لقيمته العادلة.'
      },
      {
        type: 'quote',
        text: 'قاعدة المشترين المحترفين: من يكشف سقفه أولاً يدفع أكثر. اجعل ميزانيتك القصوى سراً محفوظاً حتى لحظة المطابقة.'
      },
      {type: 'h2', text: '٥) تحرّك بسرعة عند وصول المطابقة'},
      {
        type: 'p',
        text: 'العقار الجيد في العاصمة لا ينتظر: عندما تصلك مطابقة فوق 65 نقطة فقد اجتازت فلاتر الموقع والميزانية والمواصفات آليًا. تفحص البطاقة فورًا، وإذا وافق البائع خلال مهلة الـ 48 ساعة يُكشف التواصل مباشرة بعد تسوية الرسم المعلن — وابدأ إجراءات التوثيق وأنت مرتاح أنك دفعت قيمة السوق لا أكثر.'
      }
    ]
  },
  fr: {
    title: 'Guide d’achat d’un appartement à Alger — 2026',
    excerpt:
      'Étapes concrètes, du budget réel à la signature notariée : achetez votre appartement à Alger intelligemment et évitez les pièges du marché classique.',
    seoTitle: 'Acheter un appartement à Alger en 2026 — guide complet étape par étape',
    seoDescription:
      'Guide pratique pour acheter à Alger : budget réel, choix de la commune et du quartier, documents légaux obligatoires, et économies via la négociation en aveugle.',
    category: 'Guides d’achat',
    tags: ['achat appartement', 'Alger', 'documents immobiliers', 'conseils acheteurs'],
    blocks: [
      {
        type: 'p',
        text: 'Acheter un appartement à Alger est la plus grande décision financière de la plupart des familles algériennes. Pourtant, beaucoup d’acheteurs entrent sur le marché sans plan : budget approximatif, documents non vérifiés, et négociation à visage découvert qui révèle leur plafond dès la première minute. Voici le processus tel que le pratiquent les professionnels.'
      },
      {type: 'h2', text: '1) Définissez votre budget « réel », pas idéal'},
      {
        type: 'p',
        text: 'L’erreur classique consiste à ne compter que le prix de l’appartement. Additionnez toutes les charges avant d’annoncer un chiffre à quiconque :'
      },
      {
        type: 'list',
        items: [
          'Le prix du bien lui-même (la seule variable visible de tous).',
          'Frais de notaire et d’enregistrement (quelques points de pourcentage du prix).',
          'Frais d’agence ou de plateforme le cas échéant — sur Aqar Match, l’acheteur est totalement gratuit (0 DA).',
          'Travaux et mobilier initiaux : budgétez-les franchement pour éviter un crédit supplémentaire.'
        ]
      },
      {type: 'h2', text: '2) Choisissez la commune selon votre mode de vie'},
      {
        type: 'p',
        text: 'Hydra, El Biar et Ben Aknoun sont prestigieuses, mais le mètre carré y coûte deux fois celui de Bir Mourad Raïs ou Aïn Benian. Demandez-vous : où travaillé-je ? Où étudient mes enfants ? Quel temps de transport maximal accepté-je ? Retenez 2 à 3 communes et une liste de quartiers favoris — dans le moteur, mentionner le quartier augmente automatiquement votre score de matching spatial.'
      },
      {type: 'h2', text: '3) Vérifiez les documents avant toute négociation'},
      {
        type: 'p',
        text: 'Exigez une copie du titre d’origine avant d’avancer : acte notarié ou livret foncier sont les titres forts ; promesse de vente ou décision d’attribution passent avec vérifications ; le sous-seing privé seul reste un risque à prixer franchement ou à éviter. Les dossiers « en régularisation » sont fréquents dans les promotions — ne les refusez pas automatiquement, mais vérifiez le dossier auprès de la commune.'
      },
      {type: 'h2', text: '4) Ne révélez jamais votre plafond'},
      {
        type: 'p',
        text: 'Sur le marché classique, l’intermédiaire connaît votre plafond et le minimum du vendeur — et capte l’écart avec l’un ou l’autre. La négociation en aveugle inverse l’équation : vous saisissez votre budget maximal en secret, le vendeur saisit son minimum en secret, et seul le moteur rapproche les offres mathématiquement compatibles. Résultat : personne ne lit dans votre jeu, et le prix final se rapproche de la juste valeur.'
      },
      {
        type: 'quote',
        text: 'Règle des acheteurs professionnels : qui révèle son plafond en premier paie plus. Gardez votre budget maximal secret jusqu’au match.'
      },
      {type: 'h2', text: '5) Agissez vite à la réception d’un match'},
      {
        type: 'p',
        text: 'Un bon bien à Alger n’attend pas : un match au-dessus de 65 points a déjà passé les filtres de localisation, budget et caractéristiques. Examinez la fiche immédiatement ; si le vendeur accepte sous 48 h, le contact est révélé après règlement des frais annoncés — et vous démarrez le notariat en sachant que vous avez payé la valeur du marché, pas davantage.'
      }
    ]
  }
};

const SECRET_PRICE: BlogPostDefinition = {
  slug: 'prix-minimum-secret-negociation',
  coverImageUrl: '/blog/covers/secret-price.jpg',
  publishedAt: '2026-07-16T09:00:00.000Z',
  updatedAt: '2026-07-16T09:00:00.000Z',
  wilayaCode: null,
  ar: {
    title: 'الحد الأدنى السري: كيف تبيع بسعرك دون أن يعرف أحد سقفك؟',
    excerpt:
      'لماذا يخسر البائع الجزائري آلاف الدنانير في السوق الشفاف؟ وكيف يحافظ نموذج التفاوض الأعمى ثنائي الاتجاه على قوتك التفاوضية كاملة.',
    seoTitle: 'الحد الأدنى السري في البيع العقاري — التفاوض الأعمى ثنائي الاتجاه',
    seoDescription:
      'شرح نموذج الحد الأدنى السري: سرّية متماثلة للبائع والمشتري، مطابقة رياضية بلا وسطاء يقرؤون أوراقك، ورسوم بائع محسوبة بشفافية من جدول ثابت.',
    category: 'نموذج المنصة',
    tags: ['الحد الأدنى السري', 'تفاوض عقاري', 'بيع عقار', 'محرك المطابقة'],
    blocks: [
      {
        type: 'p',
        text: 'في الإعلانات المفتوحة ينشر البائع سعراً مضخماً لأنه يتوقع المساومة، فيرد المشتري بعرض منخفض مبالغ فيه، وتبدأ رحلة استنزاف أسابيعها — يعرف فيها الوسيط أوراق الطرفين. الحد الأدنى السري قلب هذا السيناريو: أنت تحدد السعر الأدنى الذي تقبله فعلاً، ولا يراه أحد: لا المشتري، ولا صفحة العقار، ولا حتى لوحة تحكمك.'
      },
      {type: 'h2', text: 'سرّية متماثلة — لا طرف يقرأ أوراق الآخر'},
      {
        type: 'list',
        items: [
          'البائع يُدخل: السعر المطلوب (علني) + الحد الأدنى السري (محفوظ في المحرك فقط).',
          'المشتري يُدخل: ميزانيته القصوى (سرّية بالمثل — لا يطّلع عليها أي بائع).',
          'المحرك يطابق الجهتين رياضياً ويحسب رسم البائع من جدول ثابت معلن مسبقاً.',
          'لا أحد — بمن فيهم فريق المنصة في الواجهات — يرى رقم الطرف المقابل.'
        ]
      },
      {type: 'h2', text: 'كيف يُحسب رسم البائع بشفافية؟'},
      {
        type: 'p',
        text: 'للبيع: جدول شرائح ثابت يعتمد قيمة الحد الأدنى السري (شرائح تصاعدية معلنة في صفحة الرسوم). للإيجار والإيجار الموسمي: نصف ذلك المقابل — لأن دورة الصفقة أقصر والمخاطرة أقل. يُعرض الرسم كاملاً قبل تأكيد النشر، ثم يخزن كـ«لقطة» على كل مطابقة: إن تغيّر الجدول غداً يبقى رسمك على مطابقات اليوم كما التزمت به.'
      },
      {type: 'h2', text: 'ماذا يحدث بعد المطابقة؟'},
      {
        type: 'p',
        text: 'ترى أنت (بائعاً) بطاقة المشتري: درجته، مواصفات طلبه، ورسمك عند الموافقة — بلا ميزانيته. أمامك 48 ساعة للموافقة أو الرفض الصامت. عند الموافقة تدفع الرسم، وتُكشف بيانات التواصل للطرفين في نفس اللحظة. لم يوافق خلال المهلة؟ تعتّم المطابقة آلياً ويعود عقارك للمحرك دون أي حرج اجتماعي أو «رفض شخصي».'
      },
      {type: 'h2', text: 'لماذا هذا أفضل من الوسيط التقليدي؟'},
      {
        type: 'p',
        text: 'الوسيط يقتات على الفجوة بين ما تقبله وما يقبله الطرف الآخر — فكل ما يعرفه عنك يضعف موقفك. المحرك يقتات على الكفاءة: كلما زادت الصفقات الناجحة زاد ربحنا، فمصلحتنا مطابقتك بأفضل سعر ممكن لا بأعمق تنازل ممكن. هذا هو الفارق الجوهري بين «سمسار يعرف أسرارك» و«محرك يحفظ أسرارك».'
      },
      {
        type: 'quote',
        text: 'حدّك الأدنى السري يُستخدم مرة واحدة: في المعادلة. ثم يختفي — بالضبط كما يجب أن يكون السر.'
      }
    ]
  },
  fr: {
    title: 'Le prix minimum secret : vendre à votre prix sans révéler votre jeu',
    excerpt:
      'Pourquoi le vendeur algérien perd-il des milliers de dinars sur le marché transparent ? Comment la négociation en aveugle bidirectionnelle préserve toute votre force.',
    seoTitle: 'Minimum secret immobilier — la négociation en aveugle bidirectionnelle',
    seoDescription:
      'Le modèle du minimum secret : confidentialité symétrique vendeur/acheteur, matching mathématique sans courtiers, frais vendeur sur grille fixe transparente.',
    category: 'Modèle de la plateforme',
    tags: ['minimum secret', 'négociation immobilière', 'vendre un bien', 'moteur de matching'],
    blocks: [
      {
        type: 'p',
        text: 'Sur les petites annonces, le vendeur affiche un prix gonflé en prévision du marchandage, l’acheteur répond par une offre exagérément basse, et commence un marathon d’usure où l’intermédiaire connaît les cartes des deux camps. Le minimum secret renverse ce scénario : vous fixez le prix plancher que vous acceptez vraiment, et personne ne le voit — ni l’acheteur, ni la page du bien, ni même votre tableau de bord.'
      },
      {type: 'h2', text: 'Confidentialité symétrique — personne ne lit les cartes d’autrui'},
      {
        type: 'list',
        items: [
          'Le vendeur saisit : le prix demandé (public) + le minimum secret (réservé au moteur).',
          'L’acheteur saisit : son budget maximal (confidentiel aussi — aucun vendeur ne le voit).',
          'Le moteur rapproche mathématiquement les compatibilités et calcule les frais vendeur sur une grille fixe publiée.', 
          'Personne — y compris l’équipe de la plateforme dans les interfaces — ne voit le chiffre de l’autre partie.'
        ]
      },
      {type: 'h2', text: 'Comment les frais vendeur sont-ils calculés ?'},
      {
        type: 'p',
        text: 'Vente : grille à tranches fixe indexée sur le minimum secret (tranches publiées sur la page des frais). Location et saisonnière : moitié de cet équivalent — cycle plus court, risque moindre. Les frais sont affichés en entier avant confirmation de publication, puis stockés en « snapshot » sur chaque match : si la grille change demain, vos matches d’aujourd’hui gardent le montant convenu.'
      },
      {type: 'h2', text: 'Que se passe-t-il après un match ?'},
      {
        type: 'p',
        text: 'Vous voyez la fiche de l’acheteur : son score, les critères de sa demande, vos frais à l’accord — jamais son budget. Vous avez 48 h pour accepter ou laisser expirer. À l’accord, vous réglez les frais et les coordonnées se révèlent aux deux parties à la même seconde. Pas de réponse sous 48 h ? Le match s’expire automatiquement et votre bien retourne au moteur, sans gêne sociale ni « refus personnel ».'
      },
      {type: 'h2', text: 'Pourquoi est-ce meilleur qu’un intermédiaire classique ?'},
      {
        type: 'p',
        text: 'L’intermédiaire se nourrit de l’écart entre ce que vous acceptez et ce que l’autre accepte : tout ce qu’il sait de vous affaiblit votre position. Le moteur se nourrit d’efficacité : plus il crée de matches réussis, plus il gagne — notre intérêt est votre meilleur prix possible, pas votre plus grande concession. C’est toute la différence entre « un agent qui connaît vos secrets » et « un moteur qui les protège ».'
      },
      {
        type: 'quote',
        text: 'Votre minimum secret n’est utilisé qu’une fois : dans l’équation. Puis il disparaît — exactement comme un secret doit le faire.'
      }
    ]
  }
};

const SEASONAL_EAST: BlogPostDefinition = {
  slug: 'location-saisonniere-cote-algerienne',
  coverImageUrl: '/blog/covers/seasonal-east.jpg',
  publishedAt: '2026-07-22T09:00:00.000Z',
  updatedAt: '2026-07-22T09:00:00.000Z',
  wilayaCode: 23,
  ar: {
    title: 'الإيجار الموسمي على الساحل الجزائري: من ماي إلى سبتمبر دون مفاجآت',
    excerpt:
      'دليل المالك والمستأجر للموسم الصيفي: تجهيز العقار (سعة، مكيف، مسافة الشاطئ)، التسعير الذكي بالحد الأدنى السري، والوضوح القانوني.',
    seoTitle: 'الإيجار الموسمي في الجزائر — دليل الصيف العقاري للمالك والمستأجر',
    seoDescription:
      'كيف تنجح في الإيجار الموسمي على الساحل الجزائري (عنابة، وهران)؟ تجهيزات مطلوبة، تسعير عادل بالحد الأدنى السري، ووثائق تريح الطرفين.',
    category: 'الإيجار الموسمي',
    tags: ['إيجار موسمي', 'صيف', 'عنابة', 'وهران', 'شاطئ'],
    blocks: [
      {
        type: 'p', 
        text: 'ثلاثة أشهر صيفية قد تساوي دخل سنة كاملة من الإيجار العادي في المناطق الساحلية — لكن السوق الموسمي أكثر الأسواق حساسية للتفاصيل: صورة سيئة أو توصيف ناقص يرسل المصطافين إلى المنافس التالي. إليك كيف يحترف المالكون الموسم على ساحلنا الشرقي والغربي.'
      },
      {type: 'h2', text: '١) التجهيزات الثمانية التي ترفع طلبك فعلياً'},
      {
        type: 'list',
        items: [
          'سعة فعلية واضحة (أسرّة حقيقية لا افتراضية — المحرك يعرضها كما صرّحت).',
          'مكيف هواء يعمل — من أولى نقاط الفرز عند العائلات في جويلية وأوت.',
          'مسافة صادقة إلى الشاطئ بالأمتار، تظهر في بطاقة عقارك بلا تجميل.',
          'واي فاي مستقر: أصبح شرطاً لا ميزة (العمل عن بعد صيفاً).',
          'موقف سيارة مضمون في موسم تكتظ فيه الواجهات البحرية.',
          'مطبخ مجهز فعلياً للاستعمال العائلي اليومي.',
          'مسبح أو إطلالة بحرية إن توفرت — صرّح بها حرفياً لتصل للباحث الصح.',
          'صور WebP نظيفة بإضاءة نهارية: محرر الصور الآلي لدينا يوحّد الأبعاد والجودة.'
        ]
      },
      {type: 'h2', text: '٢) سعّر بمنطق «الحد الأدنى» لا بالتخمين'},
      {
        type: 'p',
        text: 'حدّد سعر الليلة/الأسبوع المعلن، ثم أسفل منه حدّك الأدنى السري — أدنى سعر تقبله في أسبوع ضعيف أو حجز متأخر. الباحث يدخل ميزانيته القصوى بسرية أيضاً، فيطابق المحرك العروض المتوافقة فقط. النتيجة: لا «شحّت في العروض» على صفحتك علناً، ولا حجوزات أقل من كلفتك الحقيقية.'
      },
      {type: 'h2', text: '٣) الوضوح القانوني يبيع قبل الصور'},
      {
        type: 'p',
        text: 'صرّح بحالتك القانونية بدقة (عقد موثق، دفتر عقاري، قرار امتياز…) حتى في الموسمي — فهي تظهر للمستأجر كعنصر ثقة، وتدخل ضمن درجة اكتمال البيانات التي يرفع بها المحرك ترتيب بطاقتك. عائلة تسافر 400 كلم تريد رقم هاتف صاحب حق لا «مكتب» مجهول.'
      },
      {type: 'h2', text: '٤) للمستأجر: كيف تضمن أن ما حجزتَه هو ما ستجده؟'},
      {
        type: 'p',
        text: 'اقرأ بطاقة المواصفات كاملة (السعة، المسافة، التجهيزات) — فكل حقل معروض صرّح به المالك تحت مسؤوليته، والمحرك يخفض ترتيب الإعلانات الناقصة تلقائياً. عند كشف التواصل بعد اكتمال المطابقة، اتفق كتابياً (رسالة نصية) على: عدد الليالي، السعر الإجمالي، التجهيزات المذكورة، وساعة التسليم. رسالة واحدة واضحة تغني عن ليلة نقاش على باب العمارة.'
      },
      {
        type: 'quote',
        text: 'الموسم الناجح يُصنع في ماي: جهّز، صوّر، صرّح بدقة — ثم دع المحرك يوزع الطلب.'
      }
    ]
  },
  fr: {
    title: 'Location saisonnière sur la côte algérienne : un été sans mauvaises surprises',
    excerpt:
      'Guide propriétaire et locataire pour la saison : équipements attendus (capacité, clim, plage), tarification au minimum secret, et clarté juridique.',
    seoTitle: 'Location saisonnière en Algérie — guide d’été pour propriétaire et locataire',
    seoDescription:
      'Réussir la location saisonnière sur la côte algérienne (Annaba, Oran) : équipements qui font la différence, pricing au minimum secret, documents rassurants.',
    category: 'Location saisonnière',
    tags: ['location saisonnière', 'été', 'Annaba', 'Oran', 'plage'],
    blocks: [
      {
        type: 'p',
        text: 'Trois mois d’été peuvent égaler une année de loyer classique sur le littoral — mais le marché saisonnier est le plus sensible aux détails : une mauvaise photo ou une fiche incomplète envoie les vacanciers chez le concurrent. Voici comment les propriétaires professionnels préparent la saison sur les côtes Est et Ouest.'
      },
      {type: 'h2', text: '1) Les huit équipements qui boostent réellement votre demande'},
      {
        type: 'list',
        items: [
          'Capacité réelle (lits véritables, pas d’approximation — le moteur affiche ce que vous déclarez).',
          'Climatisation fonctionnelle — premier critère des familles en juillet-août.',
          'Distance honnête à la plage en mètres, affichée telle quelle sur votre fiche.',
          'Wi-Fi stable : devenu une exigence, plus un luxe (télétravail d’été).',
          'Stationnement garanti en saison de grande affluence.',
          'Cuisine réellement équipée pour un usage familial quotidien.',
          'Piscine ou vue mer si disponibles — déclarez-les telles quelles pour le bon chercheur.',
          'Photos lumineuses : notre pipeline convertit et uniformise automatiquement en WebP.'
        ]
      },
      {type: 'h2', text: '2) Prix : pensez « minimum secret », pas au doigt mouillé'},
      {
        type: 'p',
        text: 'Fixez votre prix affiché à la nuit/semaine, puis en dessous votre minimum secret — le tarif plancher accepté en semaine creuse ou réservation de dernière minute. Le chercheur saisit aussi son budget maximal en secret : le moteur ne rapproche que les offres compatibles. Résultat : ni braderie publique sur votre fiche, ni réservations sous votre coût réel.'
      },
      {type: 'h2', text: '3) La clarté juridique vend avant les photos'},
      {
        type: 'p',
        text: 'Déclarez votre statut avec précision (acte notarié, livret foncier, décision d’attribution…) même en saisonnier : c’est un marqueur de confiance visible, et il entre dans le score de complétude qui fait remonter votre fiche. Une famille qui parcourt 400 km veut un numéro de propriétaire réel, pas un « bureau » anonyme.'
      },
      {type: 'h2', text: '4) Locataire : garantir que le bien réservé sera le bien trouvé'},
      {
        type: 'p',
        text: 'Lisez la fiche complète (capacité, distance, équipements) : chaque champ est déclaré par le propriétaire sous sa responsabilité, et le moteur pénalise automatiquement les fiches incomplètes. À la révélation du contact après match abouti, confirmez par écrit (SMS) : nombre de nuits, prix total, équipements annoncés, heure de remise. Un message clair vaut mieux qu’une discussion au pied de l’immeuble.'
      },
      {
        type: 'quote',
        text: 'Un été réussi se prépare en mai : équipez, photographiez, déclarez avec précision — puis laissez le moteur distribuer la demande.'
      }
    ]
  }
};

export const BLOG_POSTS: readonly BlogPostDefinition[] = [
  GUIDE_ALGER,
  SECRET_PRICE,
  SEASONAL_EAST
];

// ─── وصولات ──────────────────────────────────────────────────────────────────

/** الأحدث أولاً */
export function listBlogPosts(): readonly BlogPostDefinition[] {
  return [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBlogPost(slug: string): BlogPostDefinition | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

/** دقائق قراءة تقريبية (200 كلمة/دقيقة — نفس تقدير Medium) */
export function readingTimeMinutes(post: BlogPostDefinition, locale: AppLocale): number {
  const content = post[locale];
  const words = content.blocks
    .map((block) => (block.type === 'list' ? block.items.join(' ') : block.text))
    .join(' ')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return Math.max(1, Math.round(words / 200));
}
