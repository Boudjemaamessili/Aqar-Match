"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Lang = "ar" | "fr";

type Dict = Record<string, string>;

// قاموس الترجمات الكامل للواجهة
const translations: Record<Lang, Dict> = {
  ar: {
    // عام
    brand_aqar: "عقار",
    brand_match: "Match",
    back_home: "العودة للرئيسية",
    next: "التالي",
    previous: "السابق",
    cancel: "إلغاء",
    edit: "تعديل",
    save: "حفظ",
    send: "إرسال",
    confirm: "تأكيد",
    required: "إلزامي",
    optional: "اختياري",
    // التنقل
    nav_home: "الرئيسية",
    nav_publish: "أنشر عقارا",
    nav_search: "أبحث عن عقار",
    nav_account: "حسابي",
    nav_dashboard: "لوحة البيانات",
    // Hero
    hero_tagline: "أول منصة عقارية للمطابقة الذكية في الجزائر",
    hero_no_browse: "لا تصفّح، لابحث",
    hero_smart_match: "فقط تطابق ذكي",
    hero_question: "كم اتصالاً غير مفيد أجريت قبل أن تجد العقار المناسب؟",
    hero_promise:
      "عقار Match يربطك مباشرة بالعرض الذي يناسبك — دون كشف بياناتك لأحد.",
    cta_seller: "أنا بائع/مؤجر",
    cta_buyer: "أنا مشترٍ/مستأجر",
    // نقاط الألم
    pain_title_1: "خصوصية مطلقة",
    pain_desc_1: "بياناتك المالية مشفرة ومحمية",
    pain_title_2: "مطابقة فورية",
    pain_desc_2: "خوارزمية ذكية تربطك بالعرض المناسب",
    pain_title_3: "صفر تصفّح",
    pain_desc_3: "لا قوائم عقارية ولا تمرير لا نهائي",
    // كيف تعمل
    how_title_a: "كيف تعمل",
    how_title_b: "؟",
    how_subtitle: "أربع خطوات تفصلك فقط عن صفقتك العقارية المثالية",
    step1_title: "البائع/المؤجر يدخل عقاره",
    step1_desc:
      "يملأ نموذجًا ديناميكيًا حسب نوع العقار ويحدد السعر الأدنى السري",
    step2_title: "المشتري يحدد معاييره",
    step2_desc: "يختار نوع العقار، الولاية، البلدية، الحي وميزانيته",
    step3_title: "المحرك السري يعمل",
    step3_desc:
      "الخوارزمية تقارن الميزانية بالحد الأدنى للبائع، لا أحد يرى أرقام الطرف الآخر",
    step4_title: "تطابق! تواصل مباشر",
    step4_desc:
      "عند التطابق يتلقى البائع إشعارًا فوريًا ولا يتم كشف أرقام التواصل إلا بعد أن يؤكد الطرفان جديتهما بدفع رسم رمزي وشفاف (بدون عمولة)",
    // الإحصائيات
    stats_title: "المنصة في أرقام",
    stat_active: "عقار نشط",
    stat_sale: "للبيع",
    stat_rent: "للإيجار",
    // الآراء
    reviews_title: "آراء المستخدمين",
    reviews_subtitle: "ما يقوله من جربوا المنصة",
    reviews_empty: "لا توجد تقييمات بعد",
    // التذييل
    footer_text: "عقار Match 2026 – المنصة الذكية للعقارات في الجزائر",
    // مسار النشر
    publish_title: "أنشر عقارا",
    publish_subtitle: "أدخل تفاصيل عقارك وسنجد لك المشتري المناسب",
    publish_new: "نشر عقار جديد",
    step_type: "نوع العقار",
    step_location: "الموقع",
    step_pricing: "التسعير",
    step_info: "معلوماتك",
    step_photos: "الصور",
    transaction_type: "نوع المعاملة",
    transaction_sale: "بيع",
    transaction_rent: "إيجار",
    property_type: "نوع العقار",
    type_apartment: "شقة",
    type_villa: "فيلا",
    type_house: "منزل فردي",
    type_shop: "محل تجاري",
    type_buildable_land: "أرض صالحة للبناء",
    type_farmland: "أرض فلاحية",
    wilaya: "الولاية",
    choose_wilaya: "إختر الولاية",
    commune: "البلدية",
    choose_commune: "إختر الولاية أولا",
    neighborhood: "الحي",
    property_details: "تفاصيل العقار",
    area: "المساحة (م²)",
    area_hectare: "المساحة (هكتار)",
    rooms: "عدد الغرف",
    floor: "الطابق",
    bathrooms: "عدد الحمامات",
    facades: "عدد الواجهات",
    legal_status: "الوضعية القانونية",
    legal_book: "دفتر عقاري",
    legal_authenticated: "عقد مشهر",
    legal_registered: "عقد مسجل وغير مشهر",
    legal_admin: "قرار إداري",
    legal_private: "عقد عرفي",
    legal_none: "بدون وثائق",
    listing_title: "عنوان العرض",
    listing_title_ph: "مثال: شقة F3 في وسط المدينة",
    listing_desc: "وصف إضافي",
    listing_desc_ph: "إختياري: أضف وصفًا تقصيليًا لعقارك",
    asking_price: "السعر المطلوب (دج)",
    secret_min: "الحد الأدنى السري (دج)",
    secret_alert:
      "هذا الرقم سري ومشفّر بالكامل — لن يظهر لأي مشترٍ أو طرف ثالث",
    transparent_fees:
      "رسوم شفافة (لا تدفع إلا عند وجود تطابق حقيقي مع عقارك بدون أي عمولة على البيع)",
    fee_example: "مثلا: 5.000 دج",
    account_type: "نوع الحساب",
    account_individual: "فرد",
    account_agency: "وكالة عقارية",
    account_notary: "مرقي عقاري",
    full_name: "الاسم واللقب",
    whatsapp: "رقم الهاتف (واتساب)",
    whatsapp_note1: "سيتم التواصل معك عبر واتساب عند وجود مشترٍ مطابق",
    whatsapp_note2:
      "رقمك لن يُكشف لأي مشترٍ إلا بعد موافقتك ودفع الطرف الآخر",
    photos_title: "صور العقار",
    photos_subtitle: "أضف صورًا لعقارك لجذب المشترين (اختياري)",
    photos_desc:
      "الصور تمنح عقارك مصداقية أعلى، وتساعد المشتري الجاد على اتخاذ قرار أسرع عند التطابق",
    add_photo: "أضف صورة",
    photo_limits: "يمكنك إضافة حتى 5 صور · الحد الأقصى 5 ميغابايت لكل صورة",
    publish_btn: "نشر عقارك",
    publish_success:
      "عقارك نُشر وهو الآن بحالة 'غير مُراقب'. أنشئ حسابًا في 20 ثانية لتعديله وتلقي الإشعارات.",
    create_account_20s: "أنشئ حسابًا في 20 ثانية",
    // مسار البحث
    search_title: "البحث عن عقار",
    search_subtitle: "حدد معاييرك وميزانيتك — والباقي علينا",
    what_do_you_want: "ماذا تريد؟",
    buy_property: "شراء عقار",
    rent_property: "استئجار عقار",
    search_secure_note: "معايير بحثك وميزانيتك ستظلان سريين. لن تظهرا لأي بائع",
    which_type: "أي نوع عقار تبحث عنه؟",
    where_property: "أين تريد العقار؟",
    max_budget: "أقصى ميزانية يمكنك تحمّلها (دج)",
    budget_ph: "مثال 10000000 دج",
    budget_secret: "ميزانيتك القصوى سريّة تمامًا. لا يراها أي بائع.",
    budget_use: "تُستخدم فقط لمطابقتك بعقارات ضمن حدودك التي ترتاح لها.",
    budget_tip: "نصيحة: الميزانيات الواقعية تحصل على تطابقات أسرع.",
    your_contact: "بياناتك للتواصل",
    contact_note: "سيتم استخدام رقمك لإشعار البائعين المطابقين بك فورًا عبر واتساب",
    full_name_label: "الاسم الكامل",
    whatsapp_ph: "××××××××××××0",
    phone_secret: "رقمك لن يُكشف لأي بائع إلا بعد موافقة الطرفين.",
    search_summary: "ملخص البحث",
    summary_deal: "المعاملة",
    summary_type: "النوع",
    summary_location: "الموقع",
    summary_budget: "الميزانية",
    attempts_warning:
      "الحد الأقصى 3 محاولات بحث لنفس المعايير خلال 24 ساعة. يُطبَّق هذا التقييد لحماية أسعار البائعين السرية من الاستخراج.",
    start_matching: "بدء المطابقة",
    no_match_title: "لا توجد عروض مطابقة",
    no_match_desc: "لا توجد حاليًا عروض في منطقتك المحددة.",
    no_match_engine:
      "محركنا السري يحتفظ ببحثك. سنخبرك فور توفر عقار جديد يطابق معاييرك.",
    new_search: "بحث جديد",
    edit_budget: "تعديل الميزانية",
    match_found_title: "وجدنا تطابقًا!",
    match_found_desc:
      "هناك عقار واحد يطابق معاييرك وميزانيتك تمامًا.",
    match_found_cta:
      "لعرض تفاصيل العقار وإشعار البائع بك، يلزم تأكيد جديتك بدفع الرسم الشفاف (بدون عمولة).",
    fee_summary: "ملخص الرسم",
    buyer_fee: "رسم المشتري (نصف رسم البائع)",
    fee_refund_note: "يُدفع مرة واحدة فقط. يُسترد إذا لم يستجب البائع خلال 48 ساعة.",
    pay_confirm: "دفع وتأكيد الجدية",
    edit_search: "تعديل البحث",
    seriousness_confirmed: "تم تأكيد جديتك!",
    seller_notified: "تم إشعار البائع بك. سيتواصل معك قريبًا عبر واتساب.",
    matched_properties: "العقارات المطابقة",
    match_strong: "مطابقة قوية",
    area_approx: "المساحة (تقريبية)",
    search_canceled:
      "تم إلغاء البحث. يمكنك العودة في أي وقت. محركنا السري يحتفظ بمعاييرك.",
    // الحساب ولوحة البيانات
    account_title: "حسابي",
    account_login_prompt: "أنشئ حسابًا أو سجّل الدخول لمتابعة عقاراتك وإشعاراتك.",
    dashboard_title: "لوحة البيانات",
    dashboard_login_prompt: "سجّل الدخول لعرض لوحة بياناتك.",
    login_btn: "تسجيل الدخول",
    signup_btn: "إنشاء حساب",
    wilayas_list_label: "الولايات الجزائرية",
    // === صفحة الدخول ===
    login_welcome: "مرحبًا بعودتك",
    login_subtitle: "ادخل إلى لوحة التحكم لمتابعة عقاراتك وإشعاراتك",
    login_email: "البريد الإلكتروني",
    login_email_ph: "name@example.com",
    login_password: "كلمة المرور",
    login_password_ph: "••••••••",
    login_remember: "تذكّرني",
    login_forgot: "نسيت كلمة المرور؟",
    login_signin_btn: "دخول",
    login_or: "أو",
    login_google: "الدخول عبر Google",
    login_no_account: "ليس لديك حساب؟",
    login_signup_link: "أنشئ حسابًا",
    login_secure_note: "🔒 بياناتك محمية بتشفير كامل وفق معايير الأمان الجزائرية",
    // 2FA
    otp_title: "تحقق ثنائي العامل",
    otp_subtitle: "أرسلنا رمزًا من 6 أرقام إلى بريدك الإلكتروني",
    otp_sent_to: "تم إرسال الرمز إلى",
    otp_enter_code: "أدخل رمز التحقق",
    otp_expires_in: "ينتهي الرمز خلال",
    otp_resend: "إعادة إرسال الرمز",
    otp_resend_in: "إعادة الإرسال خلال",
    otp_verify: "تأكيد الرمز",
    otp_invalid: "الرمز غير صحيح أو منتهي الصلاحية",
    otp_trust_device: "تذكّر هذا الجهاز (تخطّي 2FA لمدة 30 يومًا)",
    otp_back: "العودة لتسجيل الدخول",
    otp_change_email: "تغيير البريد",
    // حالات المصادقة
    auth_invalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    auth_google_pending: "جاري المصادقة عبر Google...",
    auth_success: "تم تسجيل الدخول بنجاح",
    auth_redirecting: "جاري التوجيه...",
    auth_failed_2fa: "فشل التحقق الثنائي. يرجى المحاولة مرة أخرى.",
    // التوجيه الذكي
    redirect_owner: "مرحبًا مالك العقار! جاري توجيهك إلى لوحة الإدارة...",
    redirect_seeker: "مرحبًا باحث العقار! جاري توجيهك إلى واجهة البحث...",
    // صفحة الحساب بعد الدخول
    account_logged_in_as: "مسجّل الدخول كـ",
    account_role_owner: "مالك عقار",
    account_role_seeker: "باحث عقار",
    account_logout: "تسجيل الخروج",
    account_my_properties: "عقاراتي",
    account_notifications: "الإشعارات",
    account_settings: "الإعدادات",
  },
  fr: {
    brand_aqar: "Aqar",
    brand_match: "Match",
    back_home: "Retour à l'accueil",
    next: "Suivant",
    previous: "Précédent",
    cancel: "Annuler",
    edit: "Modifier",
    save: "Enregistrer",
    send: "Envoyer",
    confirm: "Confirmer",
    required: "Obligatoire",
    optional: "Optionnel",
    nav_home: "Accueil",
    nav_publish: "Publier",
    nav_search: "Rechercher",
    nav_account: "Compte",
    nav_dashboard: "Tableau de bord",
    hero_tagline: "Première plateforme immobilière intelligente en Algérie",
    hero_no_browse: "Pas de navigation, juste recherche",
    hero_smart_match: "Correspondance intelligente uniquement",
    hero_question:
      "Combien d'appels inutiles avez-vous passés avant de trouver le bien idéal ?",
    hero_promise:
      "Aqar Match vous connecte directement à l'offre qui vous correspond — sans divulguer vos données.",
    cta_seller: "Je suis vendeur/bailleur",
    cta_buyer: "Je suis acheteur/locataire",
    pain_title_1: "Confidentialité absolue",
    pain_desc_1: "Vos données financières sont chiffrées et protégées",
    pain_title_2: "Correspondance instantanée",
    pain_desc_2: "Algorithme intelligent qui trouve l'offre idéale",
    pain_title_3: "Zéro navigation",
    pain_desc_3: "Pas de listes immobilières ni de défilement infini",
    how_title_a: "Comment fonctionne",
    how_title_b: " ?",
    how_subtitle: "Quatre étapes seulement vous séparent de votre transaction idéale",
    step1_title: "Vendeur/Bailleur saisit son bien",
    step1_desc:
      "Remplit un formulaire dynamique selon le type de bien et fixe son prix minimum secret",
    step2_title: "Acheteur définit ses critères",
    step2_desc:
      "Choisit le type de bien, la wilaya, la commune, le quartier et son budget",
    step3_title: "Le moteur secret agit",
    step3_desc:
      "L'algorithme compare le budget au minimum du vendeur, personne ne voit les chiffres de l'autre",
    step4_title: "Correspondance ! Contact direct",
    step4_desc:
      "À la correspondance, le vendeur reçoit une notification instantanée. Les numéros ne sont révélés qu'après confirmation de la sérieux des deux parties par un frais symbolique transparent (sans commission)",
    stats_title: "La plateforme en chiffres",
    stat_active: "Bien actif",
    stat_sale: "À vendre",
    stat_rent: "À louer",
    reviews_title: "Avis utilisateurs",
    reviews_subtitle: "Ce que disent ceux qui ont essayé la plateforme",
    reviews_empty: "Pas encore d'avis",
    footer_text: "Aqar Match 2026 – La plateforme immobilière intelligente en Algérie",
    publish_title: "Publier un bien",
    publish_subtitle:
      "Saisissez les détails de votre bien et nous trouverons l'acheteur idéal",
    publish_new: "Publier un nouveau bien",
    step_type: "Type de bien",
    step_location: "Emplacement",
    step_pricing: "Tarification",
    step_info: "Vos informations",
    step_photos: "Photos",
    transaction_type: "Type de transaction",
    transaction_sale: "Vente",
    transaction_rent: "Location",
    property_type: "Type de bien",
    type_apartment: "Appartement",
    type_villa: "Villa",
    type_house: "Maison individuelle",
    type_shop: "Local commercial",
    type_buildable_land: "Terrain constructible",
    type_farmland: "Terrain agricole",
    wilaya: "Wilaya",
    choose_wilaya: "Choisir la wilaya",
    commune: "Commune",
    choose_commune: "Choisir la wilaya d'abord",
    neighborhood: "Quartier",
    property_details: "Détails du bien",
    area: "Surface (m²)",
    area_hectare: "Surface (hectare)",
    rooms: "Nombre de pièces",
    floor: "Étage",
    bathrooms: "Salles de bain",
    facades: "Facades",
    legal_status: "Statut juridique",
    legal_book: "Livre foncier",
    legal_authenticated: "Acte authentifié",
    legal_registered: "Acte enregistré non authentifié",
    legal_admin: "Décision administrative",
    legal_private: "Acte sous seing privé",
    legal_none: "Sans documents",
    listing_title: "Titre de l'annonce",
    listing_title_ph: "Ex: Appartement F3 au centre-ville",
    listing_desc: "Description supplémentaire",
    listing_desc_ph: "Optionnel : ajoutez une description détaillée",
    asking_price: "Prix demandé (DZD)",
    secret_min: "Minimum secret (DZD)",
    secret_alert:
      "Ce chiffre est secret et entièrement chiffré — invisible pour tout acheteur ou tiers",
    transparent_fees:
      "Frais transparents (vous ne payez qu'en cas de correspondance réelle, sans commission sur la vente)",
    fee_example: "Ex: 5 000 DZD",
    account_type: "Type de compte",
    account_individual: "Particulier",
    account_agency: "Agence immobilière",
    account_notary: "Notaire",
    full_name: "Nom et prénom",
    whatsapp: "Téléphone (WhatsApp)",
    whatsapp_note1:
      "Vous serez contacté via WhatsApp si un acheteur correspondant se présente",
    whatsapp_note2:
      "Votre numéro ne sera révélé qu'après votre accord et le paiement de l'autre partie",
    photos_title: "Photos du bien",
    photos_subtitle: "Ajoutez des photos pour attirer les acheteurs (optionnel)",
    photos_desc:
      "Les photos donnent plus de crédibilité à votre bien et aident l'acheteur sérieux à décider plus vite",
    add_photo: "Ajouter une photo",
    photo_limits: "Jusqu'à 5 photos · 5 Mo maximum par photo",
    publish_btn: "Publier votre bien",
    publish_success:
      "Votre bien est publié et en statut 'non modéré'. Créez un compte en 20 secondes pour le modifier et recevoir les notifications.",
    create_account_20s: "Créer un compte en 20 secondes",
    search_title: "Rechercher un bien",
    search_subtitle: "Définissez vos critères et votre budget — on s'occupe du reste",
    what_do_you_want: "Que voulez-vous ?",
    buy_property: "Acheter un bien",
    rent_property: "Louer un bien",
    search_secure_note:
      "Vos critères et votre budget restent secrets. Ils ne seront jamais visibles par un vendeur.",
    which_type: "Quel type de bien recherchez-vous ?",
    where_property: "Où voulez-vous le bien ?",
    max_budget: "Budget maximum que vous pouvez assumer (DZD)",
    budget_ph: "Ex: 10000000 DZD",
    budget_secret: "Votre budget maximum est strictement secret. Aucun vendeur ne le voit.",
    budget_use: "Utilisé uniquement pour vous mettre en correspondance avec des biens dans vos limites.",
    budget_tip: "Astuce : les budgets réalistes obtiennent des correspondances plus rapides.",
    your_contact: "Vos coordonnées",
    contact_note: "Votre numéro servira à vous informer des vendeurs correspondants via WhatsApp",
    full_name_label: "Nom complet",
    whatsapp_ph: "××××××××××××0",
    phone_secret: "Votre numéro ne sera révélé qu'après accord des deux parties.",
    search_summary: "Résumé de la recherche",
    summary_deal: "Transaction",
    summary_type: "Type",
    summary_location: "Emplacement",
    summary_budget: "Budget",
    attempts_warning:
      "Maximum 3 recherches avec les mêmes critères en 24h. Cette restriction protège les prix secrets des vendeurs contre l'extraction.",
    start_matching: "Lancer la correspondance",
    no_match_title: "Aucune offre correspondante",
    no_match_desc: "Aucune offre actuellement dans votre zone définie.",
    no_match_engine:
      "Notre moteur secret garde votre recherche. Nous vous préviendrons dès qu'un bien correspondant sera disponible.",
    new_search: "Nouvelle recherche",
    edit_budget: "Modifier le budget",
    match_found_title: "Correspondance trouvée !",
    match_found_desc:
      "Un bien correspond exactement à vos critères et votre budget.",
    match_found_cta:
      "Pour voir les détails du bien et informer le vendeur, vous devez confirmer votre sérieux en payant les frais transparents (sans commission).",
    fee_summary: "Résumé des frais",
    buyer_fee: "Frais acheteur (la moitié des frais vendeur)",
    fee_refund_note:
      "Payé une seule fois. Remboursé si le vendeur ne répond pas sous 48 heures.",
    pay_confirm: "Payer et confirmer la sérieux",
    edit_search: "Modifier la recherche",
    seriousness_confirmed: "Votre sérieux est confirmé !",
    seller_notified: "Le vendeur a été informé. Il vous contactera bientôt via WhatsApp.",
    matched_properties: "Biens correspondants",
    match_strong: "Correspondance forte",
    area_approx: "Surface (approximative)",
    search_canceled:
      "Recherche annulée. Vous pouvez revenir à tout moment. Notre moteur secret garde vos critères.",
    account_title: "Mon compte",
    account_login_prompt:
      "Créez un compte ou connectez-vous pour suivre vos biens et notifications.",
    dashboard_title: "Tableau de bord",
    dashboard_login_prompt: "Connectez-vous pour voir votre tableau de bord.",
    login_btn: "Se connecter",
    signup_btn: "Créer un compte",
    wilayas_list_label: "Wilayas algériennes",
    // === Page de connexion ===
    login_welcome: "Bon retour",
    login_subtitle: "Accédez à votre tableau de bord pour suivre vos biens et notifications",
    login_email: "Adresse e-mail",
    login_email_ph: "name@example.com",
    login_password: "Mot de passe",
    login_password_ph: "••••••••",
    login_remember: "Se souvenir de moi",
    login_forgot: "Mot de passe oublié ?",
    login_signin_btn: "Connexion",
    login_or: "ou",
    login_google: "Continuer avec Google",
    login_no_account: "Pas de compte ?",
    login_signup_link: "Créer un compte",
    login_secure_note: "🔒 Vos données sont chiffrées selon les standards algériens",
    // 2FA
    otp_title: "Authentification à deux facteurs",
    otp_subtitle: "Nous avons envoyé un code à 6 chiffres à votre e-mail",
    otp_sent_to: "Code envoyé à",
    otp_enter_code: "Entrez le code de vérification",
    otp_expires_in: "Le code expire dans",
    otp_resend: "Renvoyer le code",
    otp_resend_in: "Renvoi dans",
    otp_verify: "Vérifier le code",
    otp_invalid: "Code incorrect ou expiré",
    otp_trust_device: "Mémoriser cet appareil (ignorer 2FA pendant 30 jours)",
    otp_back: "Retour à la connexion",
    otp_change_email: "Changer d'e-mail",
    // États d'authentification
    auth_invalid: "E-mail ou mot de passe incorrect",
    auth_google_pending: "Authentification Google en cours...",
    auth_success: "Connexion réussie",
    auth_redirecting: "Redirection...",
    auth_failed_2fa: "Échec de la 2FA. Veuillez réessayer.",
    // Redirection intelligente
    redirect_owner: "Bienvenue propriétaire ! Redirection vers le tableau de bord...",
    redirect_seeker: "Bienvenue chercheur ! Redirection vers la recherche...",
    // Page compte après connexion
    account_logged_in_as: "Connecté en tant que",
    account_role_owner: "Propriétaire",
    account_role_seeker: "Chercheur",
    account_logout: "Se déconnecter",
    account_my_properties: "Mes biens",
    account_notifications: "Notifications",
    account_settings: "Paramètres",
  },
};

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const toggle = () => setLangState((p) => (p === "ar" ? "fr" : "ar"));
  const t = (key: string) => translations[lang][key] ?? key;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
