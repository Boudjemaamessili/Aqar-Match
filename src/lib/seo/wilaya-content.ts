/**
 * محتوى SEO المنسّق لصفحات الولايات — بيانات خالصة (client-safe).
 * افتتاحية فريدة لكل ولاية (مكافحة المحتوى المكرر) + أسئلة شائعة قياسية
 * تُبنى بالاسم وعدد البلديات. كل النصوص ثنائية ar/fr.
 */

export interface LocalizedText {
  readonly ar: string;
  readonly fr: string;
}

export interface WilayaSeoContent {
  /// الرقم الرسمي — يربط بسجل geo/wilayas
  readonly code: number;
  readonly intro: LocalizedText;
}

export interface WilayaFaq {
  readonly question: string;
  readonly answer: string;
}

const CONTENTS: readonly WilayaSeoContent[] = [
  {
    code: 16,
    intro: {
      ar: 'سوق العاصمة هو الأنشط والأعلى سعراً في البلاد: من أحياء المرتفعات الراقية (حيدرة، بن عكنون، الأبيار) إلى الشرائح المتوسطة في باب الزوار وبرج الكيفان والدار البيضاء. الطلب الأكبر على الشقق F3/F4 للشراء، بينما يشد الإيجار نحو المراكز الجامعية والإدارية. مع عقار Match تحسم الصفقة بالتفاوض الأعمى: حدّك الأدنى لا يراه أحد، والمحرك يرشح لك المشترين الجادين فقط خلال ساعات.',
      fr: 'Le marché de la capitale est le plus actif et le plus cher du pays : des hauteurs prisées (Hydra, Ben Aknoun, El Biar) aux segments intermédiaires de Bab Ezzouar, Bouzaréah et Dar El Beïda. La demande la plus forte porte sur les F3/F4 à la vente, tandis que la location se concentre autour des pôles universitaires et administratifs. Avec Aqar Match, vous négociez en aveugle : votre minimum reste secret et le moteur ne vous propose que des acheteurs sérieux.'
    }
  },
  {
    code: 9,
    intro: {
      ar: 'البليدة، بوابة الأطلس وروزنامة العائلات العاصمية الهاربة من الضجيج: شوفة وميناء الصفاء السكنيين الجديدين، وأولاد يعيش للسكن العائلي الهادئ، والشري المحاذي للجامعة. أسعار أخف من العاصمة بنسبة معتبرة مع قرب السكة والطريق السيار — معادلة تجعل الطلب على الفيلات والمنازل الأسرية ينمو سنة بعد سنة.',
      fr: 'Blida, porte de l’Atlas et refuge des familles algéroises : les nouvelles cités résidentielles (Chouofa, Ouled Yaïch) offrent un cadre calme à prix nettement inférieurs à Alger, à 45 minutes par l’autoroute ou le train. Le rapport prix-qualité alimente une demande croissante sur les villas et maisons familiales, pendant que la location étudiante s’anime autour de l’université.'
    }
  },
  {
    code: 26,
    intro: {
      ar: 'المدية، عروس التل: جامعة وإدارات وطريق شمال-جنوب تجعلها عقدة سكنية صاعدة بين العاصمة والهضاب. أسعار الأراضي في الضواحي (سغوان، ذراع السماري) ما زالت في متناول البناة الأفراد، وشقق المدينة القديمة والأحياء الجديدة تجذب موظفي القطاع العام وطلاب الجامعة. فرصة ذكية لمن يبحث عن شراء أول بعائد إيجاري مستقر.',
      fr: 'Médéa, capitale des monts du Titteri : université, administrations et axe nord-sud en font un nœud résidentiel montant entre Alger et les Hauts Plateaux. Les terrains en périphérie (Segouane, Draa Essamar) restent accessibles aux constructeurs individuels, et les appartements des quartiers récents attirent fonctionnaires et étudiants. Option pertinente pour un premier achat à rendement locatif stable.'
    }
  },
  {
    code: 31,
    intro: {
      ar: 'وهران، عاصمة الغرب: مدينة بحرية متكاملة المرافق من بير الجير إلى وادي تليلات وعين الترك. السوق الموسمي يشتعل صيفاً على الشريط الساحلي (عين الترك، الشطيبي، كريستال)، بينما يقود بير الجير الطلب الدائم بفضل الجامعة والمركبات التجارية. الشقق العائلية والمحلات التجارية هي أسرع الأصول دوراناً هنا.',
      fr: 'Oran, capitale de l’Ouest : cité maritime complète, de Bir El Djir à Oued Tlélat et Aïn El Turk. Le saisonnier s’embrase l’été sur la côte (Aïn El Turk, Chatt El Hillal, Kristel), tandis que Bir El Djir mène la demande permanente grâce à l’université et aux zones commerciales. Appartements familiaux et locaux commerciaux y sont les actifs les plus liquides.'
    }
  },
  {
    code: 19,
    intro: {
      ar: 'سطيف، قلب الهضاب التجاري والجامعي: من أولاد صابر إلى حي الهضاب وحملة، يتوسط الطلب الجامعي (جامعة فرحات عباس) والتجاري (بارك مول) السوق طوال السنة. الاستوديوهات والشقق الصغرى تكاد تشغَل فور عرضها للإيجار، وأسعار البيع تبقى تنافسية مقارنة بالمدن الكبرى — معادلة تحبها المحافظ العقارية الصغيرة.',
      fr: 'Sétif, cœur commercial et universitaire des Hauts Plateaux : d’Ouled Saber à El Hidhab et Houmma, la demande est portée toute l’année par l’université Ferhat Abbas et les pôles commerciaux (Park Mall). Studios et petites surfaces se louent quasi instantanément, et les prix de vente restent compétitifs face aux métropoles — un équilibre prisé des petits investisseurs.'
    }
  },
  {
    code: 25,
    intro: {
      ar: 'قسنطينة، مدينة الصخور المعلقة وجسر بوابة الشرق: علي منجلي والخروب هما محركا السكن العائلي الحديث، بينما تحتفظ سيدي مبروك والمدينة القديمة بطابع الطلب التقليدي. القنطرة بين الشرق والغرب تعطي المحلات والمكاتب قيمة استراتيجية إضافية، والجامعات الأربع تضمن عمقاً إيجارياً نادراً خارج الساحل.',
      fr: 'Constantine, ville des ponts suspendus et porte de l’Est : Ali Mendjeli et El Khroub tirent le logement familial moderne, tandis que Sidi Mabrouk et la vieille ville conservent une demande traditionnelle. Sa position charnière entre Est et Ouest donne aux commerces et bureaux une valeur stratégique, et ses universités garantissent une profondeur locative rare hors du littoral.'
    }
  },
  {
    code: 23,
    intro: {
      ar: 'عنابة، جوهرة الشرق الساحلية: من سيدي عمار إلى البوني والشطيبي، تجمع بين واجهة بحرية وعمق صناعي (الحجار). الإيجار الموسمي في سيدي سالم ورأس الحمراء وسيدي عمار من الأقوى وطنياً بين ماي وسبتمبر، والسوق السنوي يستفيد من الجامعة والمرفأ. مدرّج سكني يرضي المستثمر الموسمي والساكن الدائم معاً.',
      fr: 'Annaba, perle du littoral Est : de Sidi Ammar à El Bouni et Chetibi, elle combine façade maritime et profondeur industrielle (El Hadjar). La location saisonnière (Sidi Salem, Ras El Hamra, Sidi Ammar) est parmi les plus fortes du pays de mai à septembre, et le marché annuel profite de l’université et du port. Un terrain qui sert aussi bien l’investisseur saisonnier que le résident permanent.'
    }
  }
];

export function getWilayaSeoContent(code: number): WilayaSeoContent | undefined {
  return CONTENTS.find((c) => c.code === code);
}

/** كل المحتوى — لفحوص التكامل الاختبارية (كل الولايات السبع مغطاة) */
export function allWilayaSeoContents(): readonly WilayaSeoContent[] {
  return CONTENTS;
}

interface WilayaNameInput {
  readonly nameAr: string;
  readonly nameFr: string;
}

/**
 * ثلاثة أسئلة قياسية عالية النية البحثية لكل صفحة ولاية (تتحول FAQPage JSON-LD).
 */
export function buildWilayaFaqs(
  wilaya: WilayaNameInput,
  communesCount: number,
  locale: 'ar' | 'fr'
): readonly WilayaFaq[] {
  const name = locale === 'ar' ? wilaya.nameAr : wilaya.nameFr;
  if (locale === 'ar') {
    return [
      {
        question: `كيف أنشر عقاراً في ولاية ${name}؟`,
        answer: `النشر مجاني ويستغرق دقيقتين: أدخل نوع العقار والبلدية والسعر المطلوب وحدّك الأدنى السري (لا يراه أحد سوى المحرك)، وسيرشح محرك المطابقة عقارك للمشترين الجادين في ${name} خلال ساعات — بلا مكالمات مزعجة وبلا إعلانات مبعثرة.`
      },
      {
        question: `هل تغطي المنصة كل بلديات ولاية ${name}؟`,
        answer: `نعم — نغطي رسمياً ${communesCount} بلدية تابعة لولاية ${name} بأسمائها المعتمدة. البحث يعمل على مستوى الولاية كاملة أو بلدية محددة أو حتى قائمة أحياء مفضلة داخلها.`
      },
      {
        question: `كم تبلغ رسوم المنصة على صفقات ${name}؟`,
        answer: 'المشتري مجاني تماماً (0 دج). البائع يدفع رسماً معلناً ومقتطعاً من جدول ثابت يُحسب على أساس حده الأدنى السري (للبيع) أو نصفه (للإيجار)، ولا يُستحق إلا بعد موافقته على مطابقة ناجحة — لا دفع مسبقاً ولا عمولات خفية.'
      }
    ];
  }
  return [
    {
      question: `Comment publier un bien dans la wilaya de ${name} ?`,
      answer: `La publication est gratuite et prend deux minutes : indiquez le type de bien, la commune, le prix demandé et votre minimum secret (visible du moteur uniquement). Le moteur de matching propose ensuite votre bien aux acheteurs sérieux de ${name} en quelques heures — sans appels perturbateurs ni annonces dispersées.`
    },
    {
      question: `La plateforme couvre-t-elle toutes les communes de ${name} ?`,
      answer: `Oui — nous couvrons officiellement les ${communesCount} communes de la wilaya de ${name} avec leurs noms homologués. La recherche fonctionne à l’échelle de la wilaya entière, d’une commune précise, ou d’une liste de quartiers favoris.`
    },
    {
      question: `Quels sont les frais de la plateforme sur les ventes à ${name} ?`,
      answer: 'L’acheteur est totalement gratuit (0 DA). Le vendeur paie un droit transparent issu d’une grille fixe calculée sur son minimum secret (vente) ou sa moitié (location), exigible uniquement après son accord sur un match réussi — aucun paiement anticipé ni commission cachée.'
    }
  ];
}
