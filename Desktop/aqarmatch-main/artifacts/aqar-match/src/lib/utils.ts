<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>عقارMatch — المنصة الذكية للعقارات</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f5f5f0; color: #1a1a2e; direction: rtl; }
    header { background: #0F2744; color: white; padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
    header h1 { font-size: 1.5rem; font-weight: 700; }
    header span { color: #E8A87C; }
    nav { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
    nav button { background: transparent; border: 1.5px solid rgba(255,255,255,0.4); color: white; padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; }
    @media (max-width: 600px) { nav button { padding: 0.3rem 0.6rem; font-size: 0.75rem; } header { flex-direction: column; gap: 0.5rem; } }
    nav button:hover, nav button.active { background: #E8A87C; border-color: #E8A87C; color: #0F2744; font-weight: 600; }
    .container { max-width: 680px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 1.5rem; }
    .card h2 { font-size: 1.2rem; color: #0F2744; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid #f0f0e8; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; font-size: 0.85rem; font-weight: 600; color: #444; margin-bottom: 0.4rem; }
    input, select, textarea { width: 100%; padding: 0.65rem 0.9rem; border: 1.5px solid #ddd; border-radius: 8px; font-size: 0.95rem; font-family: inherit; direction: rtl; transition: border-color 0.2s; }
    input:focus, select:focus { outline: none; border-color: #0F2744; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
    @media (max-width: 500px) { .row { grid-template-columns: 1fr; } .row3 { grid-template-columns: 1fr 1fr; } }
    .secret-field { background: #f8f6ff; border: 1.5px dashed #b8a8e8; border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem; }
    .secret-field label { color: #6b4fa0; }
    .secret-note { font-size: 0.78rem; color: #888; margin-top: 0.35rem; }
    .btn { width: 100%; padding: 0.85rem; background: #0F2744; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #1a3a5c; }
    .btn:disabled { background: #aaa; cursor: not-allowed; }
    .alert { padding: 0.9rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
    .alert-success { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
    .alert-error { background: #fdecea; color: #c62828; border: 1px solid #ef9a9a; }
    /* بطاقة العقار */
    .listing-card { background: white; border-radius: 12px; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.08); border-right: 4px solid #0F2744; overflow: hidden; }
    .listing-card-images { width: 100%; height: 180px; overflow: hidden; position: relative; background: #eef2f8; }
    .listing-card-images img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
    .listing-card-images .no-img { display: flex; align-items: center; justify-content: center; height: 100%; color: #bbb; font-size: 3rem; }
    .listing-card-images .img-count { position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.6); color: white; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 20px; }
    .img-gallery { display: flex; gap: 4px; height: 100%; }
    .img-gallery img { flex: 1; object-fit: cover; cursor: pointer; min-width: 0; }
    .listing-card-body { padding: 1.25rem; }
    .listing-card h3 { font-size: 1rem; color: #0F2744; margin-bottom: 0.5rem; }
    .listing-meta { font-size: 0.82rem; color: #666; margin-bottom: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .tag { background: #eef2f8; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.78rem; }
    .price-badge { background: #0F2744; color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 600; font-size: 0.85rem; }
    .match-form { margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .match-form input { flex: 1; min-width: 100px; padding: 0.5rem 0.75rem; font-size: 0.85rem; }
    .match-form button { padding: 0.5rem 1rem; background: #E8A87C; color: #0F2744; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
    .page { display: none; }
    .page.active { display: block; }
    .loading { text-align: center; color: #888; padding: 2rem; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-box { background: white; border-radius: 10px; padding: 1rem; text-align: center; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }
    .stat-num { font-size: 1.8rem; font-weight: 700; color: #0F2744; }
    .stat-label { font-size: 0.78rem; color: #888; margin-top: 0.2rem; }
    .segment { display: flex; border: 1.5px solid #ddd; border-radius: 8px; overflow: hidden; }
    .segment button { flex: 1; padding: 0.6rem; border: none; background: white; cursor: pointer; font-size: 0.9rem; font-family: inherit; transition: all 0.2s; }
    .segment button.active { background: #0F2744; color: white; font-weight: 600; }
    .neighborhoods-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.4rem; }
    .neighborhood-tag { background: #0F2744; color: white; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.78rem; display: flex; align-items: center; gap: 0.3rem; }
    .neighborhood-tag button { background: none; border: none; color: white; cursor: pointer; font-size: 0.9rem; }
    /* صور */
    .image-upload-area { border: 2px dashed #ddd; border-radius: 10px; padding: 1.5rem; text-align: center; cursor: pointer; transition: border-color 0.2s; background: #fafafa; }
    .image-upload-area:hover { border-color: #0F2744; }
    .image-upload-area input { display: none; }
    .image-upload-area p { color: #888; font-size: 0.85rem; margin-top: 0.5rem; }
    .image-previews { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
    .image-preview-item { position: relative; width: 80px; height: 80px; }
    .image-preview-item img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
    .image-preview-item button { position: absolute; top: -6px; left: -6px; background: #c62828; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 0.75rem; }
    /* lightbox */
    .lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; align-items: center; justify-content: center; flex-direction: column; gap: 1rem; }
    .lightbox.open { display: flex; }
    .lightbox img { max-width: 95vw; max-height: 80vh; border-radius: 8px; }
    .lightbox-close { position: absolute; top: 1rem; left: 1rem; background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }
    .lightbox-nav { display: flex; gap: 1rem; }
    .lightbox-nav button { background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem 1.2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; }
    /* تقييم */
    .stars-section { background: #fffbf0; border: 1.5px solid #f0d080; border-radius: 12px; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem; }
    .stars { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1rem; }
    .star { font-size: 2.5rem; cursor: pointer; color: #ddd; transition: color 0.15s, transform 0.1s; user-select: none; }
    .star:hover, .star.active { color: #f5a623; transform: scale(1.15); }
    .star-label { font-size: 0.85rem; color: #888; margin-bottom: 1rem; min-height: 1.2em; }
    .rating-comment { width: 100%; padding: 0.65rem; border: 1.5px solid #ddd; border-radius: 8px; font-size: 0.9rem; font-family: inherit; direction: rtl; resize: none; }
    .btn-rate { background: #f5a623; color: white; border: none; border-radius: 8px; padding: 0.7rem 2rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; margin-top: 0.75rem; }
    .btn-rate:disabled { background: #ccc; cursor: not-allowed; }
    .rating-item { background: #fafafa; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; }
    .rating-stars { color: #f5a623; font-size: 1rem; margin-bottom: 0.25rem; }
    .rating-date { font-size: 0.75rem; color: #aaa; margin-top: 0.2rem; }
    /* حقل مخفي */
    .hidden-field { display: none; }
    footer { text-align: center; padding: 2rem; color: #888; font-size: 0.82rem; }
  </style>
</head>
<body>

<header>
  <h1>عقار<span>Match</span></h1>
  <nav>
    <button class="active" onclick="showPage('home',this)">الرئيسية</button>
    <button onclick="showPage('seller',this)">أنشر عقاراً</button>
    <button onclick="showPage('buyer',this)">ابحث عن عقار</button>
    <button onclick="showPage('rate',this)">⭐ تقييم</button>
  </nav>
</header>

<!-- Lightbox -->
<div class="lightbox" id="lightbox" onclick="closeLightbox(event)">
  <button class="lightbox-close" onclick="closeLightbox()">✕</button>
  <img id="lightbox-img" src="">
  <div class="lightbox-nav">
    <button onclick="lbNav(-1);event.stopPropagation()">‹ السابقة</button>
    <button onclick="lbNav(1);event.stopPropagation()">التالية ›</button>
  </div>
</div>

<!-- HOME -->
<div class="page active" id="page-home">
  <div class="container">
    <div class="stat-grid">
      <div class="stat-box"><div class="stat-num" id="stat-total">—</div><div class="stat-label">عقار نشط</div></div>
      <div class="stat-box"><div class="stat-num" id="stat-sale">—</div><div class="stat-label">للبيع</div></div>
      <div class="stat-box"><div class="stat-num" id="stat-rent">—</div><div class="stat-label">للإيجار</div></div>
    </div>
    <div class="card">
      <h2>🏠 عقارMatch — الوكيل الرقمي المحايد</h2>
      <p style="color:#555;line-height:1.7;margin-bottom:1rem">المنصة الذكية التي تجمع البائع والمشتري سراً، ولا تكشف بيانات أي طرف إلا عند تطابق حقيقي.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div style="background:#f8f9ff;padding:1rem;border-radius:8px"><div style="font-size:1.3rem;margin-bottom:0.4rem">🔒</div><div style="font-weight:600;margin-bottom:0.3rem;font-size:0.9rem">سعر تفاوض سري</div><div style="font-size:0.8rem;color:#666">النظام يتفاوض بدلاً عنك</div></div>
        <div style="background:#f8f9ff;padding:1rem;border-radius:8px"><div style="font-size:1.3rem;margin-bottom:0.4rem">📷</div><div style="font-weight:600;margin-bottom:0.3rem;font-size:0.9rem">صور العقار</div><div style="font-size:0.8rem;color:#666">اعرض عقارك بالصور</div></div>
        <div style="background:#f8f9ff;padding:1rem;border-radius:8px"><div style="font-size:1.3rem;margin-bottom:0.4rem">👥</div><div style="font-weight:600;margin-bottom:0.3rem;font-size:0.9rem">خصوصية متبادلة</div><div style="font-size:0.8rem;color:#666">لا أحد يرى بيانات الآخر</div></div>
        <div style="background:#f8f9ff;padding:1rem;border-radius:8px"><div style="font-size:1.3rem;margin-bottom:0.4rem">📍</div><div style="font-weight:600;margin-bottom:0.3rem;font-size:0.9rem">توفيق بالحي</div><div style="font-size:0.8rem;color:#666">مطابقة دقيقة حتى الحي</div></div>
      </div>
    </div>
    <div class="card">
      <h2>⭐ آراء المستخدمين</h2>
      <div id="home-ratings"><div class="loading">جاري التحميل...</div></div>
    </div>
  </div>
</div>

<!-- SELLER -->
<div class="page" id="page-seller">
  <div class="container">
    <div class="card">
      <h2>📋 نشر عقار جديد</h2>
      <div id="seller-alert"></div>
      <div class="form-group">
        <label>نوع الصفقة</label>
        <div class="segment">
          <button class="active" id="btn-sale" onclick="setDealType('بيع')">بيع</button>
          <button id="btn-rent" onclick="setDealType('إيجار')">إيجار</button>
        </div>
        <input type="hidden" id="deal_type" value="بيع">
      </div>
      <div class="form-group">
        <label>نوع العقار</label>
        <select id="property_type" onchange="onPropertyTypeChange()">
          <option value="">اختر نوع العقار</option>
          <option value="شقة">🏢 شقة</option>
          <option value="فيلا">🏰 فيلا</option>
          <option value="منزل فردي">🏠 منزل فردي</option>
          <option value="تجاري">🏪 تجاري</option>
          <option value="أرض فلاحية">🌾 أرض فلاحية</option>
          <option value="أرض صالحة للبناء">🏗️ أرض صالحة للبناء</option>
          <option value="أخرى">📦 أخرى</option>
        </select>
      </div>
      <div class="row">
        <div class="form-group">
          <label>الولاية</label>
          <input type="text" id="wilaya" placeholder="مثال: البليدة">
        </div>
        <div class="form-group">
          <label>البلدية</label>
          <input type="text" id="municipality" placeholder="مثال: بوفاريك">
        </div>
      </div>
      <div class="form-group">
        <label>الأحياء</label>
        <div style="display:flex;gap:0.5rem">
          <input type="text" id="neighborhood-input" placeholder="اكتب اسم الحي ثم اضغط إضافة">
          <button onclick="addNeighborhood()" style="padding:0.65rem 1rem;background:#0F2744;color:white;border:none;border-radius:8px;cursor:pointer;white-space:nowrap">إضافة</button>
        </div>
        <div class="neighborhoods-tags" id="neighborhoods-tags"></div>
      </div>
      <!-- مساحة وغرف وواجهات -->
      <div class="row3">
        <div class="form-group">
          <label>المساحة (م²)</label>
          <input type="number" id="area" placeholder="مثال: 120">
        </div>
        <div class="form-group hidden-field" id="rooms-group">
          <label>عدد الغرف</label>
          <select id="rooms">
            <option value="">اختر</option>
            <option value="1">1 غرفة</option>
            <option value="2">2 غرف</option>
            <option value="3">3 غرف</option>
            <option value="4">4 غرف</option>
            <option value="5">5 غرف</option>
            <option value="6+">6+ غرف</option>
          </select>
        </div>
        <div class="form-group">
          <label>عدد الواجهات</label>
          <select id="facades">
            <option value="">اختر</option>
            <option value="1">واجهة 1</option>
            <option value="2">واجهتان 2</option>
            <option value="3">3 واجهات</option>
            <option value="4">4 واجهات</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div class="form-group">
          <label>السعر المعلن (دج)</label>
          <input type="number" id="asking_price" placeholder="مثال: 15000000">
        </div>
        <div class="form-group">
          <label>رقم واتساب</label>
          <input type="tel" id="user_phone" placeholder="0550000000">
        </div>
      </div>
      <div class="secret-field">
        <label>🔒 أدنى سعر مقبول (سري)</label>
        <input type="number" id="floor_price" placeholder="مثال: 12000000">
        <div class="secret-note">🛡️ هذا الرقم سري تماماً ولا يُشارك مع أحد</div>
      </div>
      <div class="form-group">
        <label>📸 صور العقار (اختياري — حتى 5 صور)</label>
        <div class="image-upload-area" onclick="document.getElementById('photo-input').click()">
          <div style="font-size:2rem">📷</div>
          <p>اضغط لإضافة صور من هاتفك أو جهازك</p>
          <input type="file" id="photo-input" accept="image/*" multiple onchange="handleImages(event)">
        </div>
        <div class="image-previews" id="image-previews"></div>
      </div>
      <button class="btn" onclick="submitListing()" id="submit-btn">نشر العقار</button>
    </div>
  </div>
</div>

<!-- BUYER -->
<div class="page" id="page-buyer">
  <div class="container">
    <div class="card" style="padding:1rem 1.5rem">
      <h2>🔍 تصفية العقارات</h2>
      <div class="row">
        <div class="form-group" style="margin-bottom:0.75rem">
          <label>نوع الصفقة</label>
          <select id="filter-deal" onchange="loadListings()">
            <option value="">الكل</option>
            <option value="بيع">بيع</option>
            <option value="إيجار">إيجار</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0.75rem">
          <label>نوع العقار</label>
          <select id="filter-type" onchange="loadListings()">
            <option value="">الكل</option>
            <option value="شقة">شقة</option>
            <option value="فيلا">فيلا</option>
            <option value="منزل فردي">منزل فردي</option>
            <option value="تجاري">تجاري</option>
            <option value="أرض فلاحية">أرض فلاحية</option>
            <option value="أرض صالحة للبناء">أرض صالحة للبناء</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label>الولاية</label>
        <input type="text" id="filter-wilaya" placeholder="جميع الولايات" oninput="loadListings()">
      </div>
    </div>
    <div id="listings-container"><div class="loading">جاري التحميل...</div></div>
  </div>
</div>

<!-- RATE -->
<div class="page" id="page-rate">
  <div class="container">
    <div class="stars-section card">
      <h3 style="color:#0F2744;margin-bottom:0.5rem;font-size:1rem">كيف تقيّم منصة عقارMatch؟</h3>
      <p style="color:#666;font-size:0.82rem;margin-bottom:1rem">رأيك يساعدنا على التحسين المستمر</p>
      <div class="stars" id="stars-input">
        <span class="star" onclick="setRating(1)" onmouseover="hoverRating(1)" onmouseout="unhoverRating()">★</span>
        <span class="star" onclick="setRating(2)" onmouseover="hoverRating(2)" onmouseout="unhoverRating()">★</span>
        <span class="star" onclick="setRating(3)" onmouseover="hoverRating(3)" onmouseout="unhoverRating()">★</span>
        <span class="star" onclick="setRating(4)" onmouseover="hoverRating(4)" onmouseout="unhoverRating()">★</span>
        <span class="star" onclick="setRating(5)" onmouseover="hoverRating(5)" onmouseout="unhoverRating()">★</span>
      </div>
      <div class="star-label" id="star-label">اختر تقييمك</div>
      <textarea class="rating-comment" id="rating-comment" rows="3" placeholder="أضف تعليقاً (اختياري)..."></textarea>
      <br>
      <button class="btn-rate" onclick="submitRating()" id="rate-btn" disabled>إرسال التقييم</button>
      <div id="rate-alert" style="margin-top:0.75rem"></div>
    </div>
    <div class="card">
      <h2>📊 تقييمات المستخدمين</h2>
      <div id="ratings-list"><div class="loading">جاري التحميل...</div></div>
    </div>
  </div>
</div>

<footer>عقارMatch © 2026 — المنصة الذكية للعقارات في الجزائر</footer>

<script>
const API = 'https://aqarmatch.onrender.com';
let neighborhoods = [];
let selectedImages = [];
let currentRating = 0;
let lbImages = [], lbIndex = 0;

// ─── التنقل ───────────────────────────────────────────────
function showPage(name, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'buyer') loadListings();
  if (name === 'home') { loadStats(); loadHomeRatings(); }
  if (name === 'rate') loadRatings();
}

// ─── نوع الصفقة ───────────────────────────────────────────
function setDealType(type) {
  document.getElementById('deal_type').value = type;
  document.getElementById('btn-sale').classList.toggle('active', type === 'بيع');
  document.getElementById('btn-rent').classList.toggle('active', type === 'إيجار');
}

// ─── إظهار/إخفاء حقل الغرف حسب نوع العقار ───────────────
function onPropertyTypeChange() {
  const type = document.getElementById('property_type').value;
  const roomsGroup = document.getElementById('rooms-group');
  if (type === 'شقة') {
    roomsGroup.classList.remove('hidden-field');
  } else {
    roomsGroup.classList.add('hidden-field');
    document.getElementById('rooms').value = '';
  }
}

// ─── الأحياء ──────────────────────────────────────────────
function addNeighborhood() {
  const input = document.getElementById('neighborhood-input');
  const val = input.value.trim();
  if (!val || neighborhoods.includes(val)) return;
  neighborhoods.push(val);
  renderNeighborhoods();
  input.value = '';
}
document.getElementById('neighborhood-input').addEventListener('keypress', e => {
  if (e.key === 'Enter') { e.preventDefault(); addNeighborhood(); }
});
function removeNeighborhood(n) { neighborhoods = neighborhoods.filter(x => x !== n); renderNeighborhoods(); }
function renderNeighborhoods() {
  document.getElementById('neighborhoods-tags').innerHTML = neighborhoods.map(n =>
    `<span class="neighborhood-tag">${n}<button onclick="removeNeighborhood('${n}')">&times;</button></span>`
  ).join('');
}

// ─── الصور ────────────────────────────────────────────────
function handleImages(e) {
  const files = Array.from(e.target.files);
  const remaining = 5 - selectedImages.length;
  files.slice(0, remaining).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => { selectedImages.push({ file, dataUrl: ev.target.result }); renderPreviews(); };
    reader.readAsDataURL(file);
  });
}
function removeImage(i) { selectedImages.splice(i, 1); renderPreviews(); }
function renderPreviews() {
  document.getElementById('image-previews').innerHTML = selectedImages.map((img, i) =>
    `<div class="image-preview-item"><img src="${img.dataUrl}"><button onclick="removeImage(${i})">×</button></div>`
  ).join('');
}

// ─── Lightbox ─────────────────────────────────────────────
function openLightbox(imgs, index) {
  lbImages = imgs; lbIndex = index;
  document.getElementById('lightbox-img').src = lbImages[lbIndex];
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox(e) {
  if (!e || e.target === document.getElementById('lightbox')) document.getElementById('lightbox').classList.remove('open');
}
function lbNav(dir) {
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  document.getElementById('lightbox-img').src = lbImages[lbIndex];
}

// ─── النشر ────────────────────────────────────────────────
async function submitListing() {
  const btn = document.getElementById('submit-btn');
  const deal_type = document.getElementById('deal_type').value;
  const property_type = document.getElementById('property_type').value;
  const wilaya = document.getElementById('wilaya').value.trim();
  const municipality = document.getElementById('municipality').value.trim();
  const asking_price = parseFloat(document.getElementById('asking_price').value);
  const floor_price = parseFloat(document.getElementById('floor_price').value);
  const user_phone = document.getElementById('user_phone').value.trim();
  const area = document.getElementById('area').value.trim();
  const rooms = document.getElementById('rooms').value;
  const facades = document.getElementById('facades').value;
  const alertDiv = document.getElementById('seller-alert');

  if (!property_type || !wilaya || !municipality || !neighborhoods.length || !asking_price || !floor_price || !user_phone) {
    alertDiv.innerHTML = '<div class="alert alert-error">يرجى ملء جميع الحقول الإلزامية</div>'; return;
  }
  if (floor_price > asking_price) {
    alertDiv.innerHTML = '<div class="alert alert-error">السعر السري يجب أن يكون أقل من السعر المعلن</div>'; return;
  }

  btn.disabled = true; btn.textContent = 'جاري النشر...';
  try {
    const images = selectedImages.map(img => img.dataUrl);
    const res = await fetch(`${API}/api/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_type, property_type, wilaya, municipality, neighborhoods, asking_price, floor_price, user_phone, area, rooms, facades, images })
    });
    const data = await res.json();
    if (res.ok) {
      alertDiv.innerHTML = '<div class="alert alert-success">✅ تم نشر عقارك بنجاح! سيتم إشعارك عند وجود مشترٍ مهتم.</div>';
      neighborhoods = []; selectedImages = []; renderNeighborhoods(); renderPreviews();
      ['wilaya','municipality','asking_price','floor_price','user_phone','area'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('property_type').value = '';
      document.getElementById('rooms').value = '';
      document.getElementById('facades').value = '';
      document.getElementById('rooms-group').classList.add('hidden-field');
    } else {
      alertDiv.innerHTML = `<div class="alert alert-error">${data.error || 'حدث خطأ'}</div>`;
    }
  } catch(e) {
    alertDiv.innerHTML = '<div class="alert alert-error">تعذر الاتصال بالخادم</div>';
  }
  btn.disabled = false; btn.textContent = 'نشر العقار';
}

// ─── تحميل العقارات ───────────────────────────────────────
async function loadListings() {
  const container = document.getElementById('listings-container');
  container.innerHTML = '<div class="loading">جاري التحميل...</div>';
  const deal = document.getElementById('filter-deal').value;
  const type = document.getElementById('filter-type').value;
  const wilaya = document.getElementById('filter-wilaya').value.trim();
  let url = `${API}/api/listings?`;
  if (deal) url += `deal_type=${encodeURIComponent(deal)}&`;
  if (wilaya) url += `wilaya=${encodeURIComponent(wilaya)}&`;
  try {
    const res = await fetch(url);
    let listings = await res.json();
    if (type) listings = listings.filter(l => l.property_type === type);
    if (!listings.length) {
      container.innerHTML = '<div class="card" style="text-align:center;color:#888;padding:2rem">لا توجد عقارات متاحة حالياً</div>'; return;
    }
    container.innerHTML = listings.map(l => {
      const imgs = l.images && l.images.length ? l.images : [];
      const imgsJson = JSON.stringify(imgs).replace(/"/g, '&quot;');
      let imgHtml = '';
      if (imgs.length === 0) {
        imgHtml = `<div class="listing-card-images"><div class="no-img">🏠</div></div>`;
      } else if (imgs.length === 1) {
        imgHtml = `<div class="listing-card-images"><img src="${imgs[0]}" onclick='openLightbox(${imgsJson},0)'></div>`;
      } else {
        const shown = imgs.slice(0, 3);
        imgHtml = `<div class="listing-card-images"><div class="img-gallery">${shown.map((img,i) => `<img src="${img}" onclick='openLightbox(${imgsJson},${i})'>`).join('')}</div>${imgs.length > 3 ? `<div class="img-count">+${imgs.length-3} صور</div>` : ''}</div>`;
      }
      const details = [
        l.area ? `📐 ${l.area} م²` : '',
        l.rooms ? `🛏 ${l.rooms} غرف` : '',
        l.facades ? `🧱 ${l.facades} واجهات` : '',
      ].filter(Boolean);
      return `
        <div class="listing-card">
          ${imgHtml}
          <div class="listing-card-body">
            <h3>${l.deal_type}${l.property_type ? ' — ' + l.property_type : ''} — ${l.wilaya}، ${l.municipality}</h3>
            <div class="listing-meta">
              ${(l.neighborhoods||[]).map(n => `<span class="tag">📍 ${n}</span>`).join('')}
              ${details.map(d => `<span class="tag">${d}</span>`).join('')}
              <span class="tag">⏰ ${l.days_remaining} يوم</span>
            </div>
            <span class="price-badge">${l.asking_price.toLocaleString()} دج</span>
            <div class="match-form">
              <input type="number" placeholder="ميزانيتك (دج)" id="budget-${l.id}">
              <input type="tel" placeholder="واتساب" id="phone-${l.id}">
              <button onclick="checkMatch(${l.id})">فحص التطابق</button>
            </div>
            <div id="match-result-${l.id}"></div>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    container.innerHTML = '<div class="card" style="text-align:center;color:#c62828">تعذر تحميل العقارات</div>';
  }
}

async function checkMatch(id) {
  const budget = parseFloat(document.getElementById(`budget-${id}`).value);
  const buyer_phone = document.getElementById(`phone-${id}`).value.trim();
  const resultDiv = document.getElementById(`match-result-${id}`);
  if (!budget || !buyer_phone) { resultDiv.innerHTML = '<div class="alert alert-error" style="margin-top:0.5rem">يرجى إدخال الميزانية ورقم الواتساب</div>'; return; }
  resultDiv.innerHTML = '<div style="color:#888;font-size:0.85rem;margin-top:0.5rem">جاري الفحص...</div>';
  try {
    const res = await fetch(`${API}/api/listings/${id}/match`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({budget, buyer_phone}) });
    const data = await res.json();
    resultDiv.innerHTML = `<div class="alert alert-${data.matched ? 'success' : 'error'}" style="margin-top:0.5rem">${data.message}</div>`;
  } catch(e) { resultDiv.innerHTML = '<div class="alert alert-error" style="margin-top:0.5rem">تعذر الاتصال بالخادم</div>'; }
}

async function loadStats() {
  try {
    const res = await fetch(`${API}/api/listings/stats`);
    const data = await res.json();
    document.getElementById('stat-total').textContent = data.total ?? 0;
    document.getElementById('stat-sale').textContent = data.for_sale ?? 0;
    document.getElementById('stat-rent').textContent = data.for_rent ?? 0;
  } catch(e) {}
}

// ─── التقييمات ────────────────────────────────────────────
const starLabels = ['','سيء جداً','سيء','مقبول','جيد','ممتاز! 🎉'];
let ratings = [];
try { ratings = JSON.parse(localStorage.getItem('aqar_ratings') || '[]'); } catch(e) {}

function hoverRating(n) {
  document.querySelectorAll('.star').forEach((s,i) => s.classList.toggle('active', i < n));
  document.getElementById('star-label').textContent = starLabels[n];
}
function unhoverRating() {
  document.querySelectorAll('.star').forEach((s,i) => s.classList.toggle('active', i < currentRating));
  document.getElementById('star-label').textContent = currentRating ? starLabels[currentRating] : 'اختر تقييمك';
}
function setRating(n) { currentRating = n; document.getElementById('rate-btn').disabled = false; unhoverRating(); }

function submitRating() {
  if (!currentRating) return;
  const comment = document.getElementById('rating-comment').value.trim();
  ratings.unshift({ stars: currentRating, comment, date: new Date().toLocaleDateString('ar-DZ') });
  if (ratings.length > 50) ratings = ratings.slice(0, 50);
  try { localStorage.setItem('aqar_ratings', JSON.stringify(ratings)); } catch(e) {}
  document.getElementById('rate-alert').innerHTML = '<div class="alert alert-success">✅ شكراً على تقييمك!</div>';
  document.getElementById('rating-comment').value = '';
  currentRating = 0;
  document.getElementById('rate-btn').disabled = true;
  unhoverRating();
  loadRatings();
  setTimeout(() => document.getElementById('rate-alert').innerHTML = '', 3000);
}

function renderRatingsList(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!ratings.length) { el.innerHTML = '<div style="text-align:center;color:#888;padding:1rem">لا توجد تقييمات بعد</div>'; return; }
  const avg = (ratings.reduce((s,r) => s + r.stars, 0) / ratings.length).toFixed(1);
  el.innerHTML = `<div style="text-align:center;margin-bottom:1rem"><div style="font-size:2rem;font-weight:700;color:#0F2744">${avg}</div><div style="color:#f5a623;font-size:1.2rem">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5-Math.round(avg))}</div><div style="font-size:0.8rem;color:#888">${ratings.length} تقييم</div></div>`
  + ratings.slice(0,10).map(r => `<div class="rating-item"><div class="rating-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</div>${r.comment ? `<div style="font-size:0.82rem;color:#555">${r.comment}</div>` : ''}<div class="rating-date">${r.date}</div></div>`).join('');
}

function loadRatings() { renderRatingsList('ratings-list'); }
function loadHomeRatings() { renderRatingsList('home-ratings'); }

loadStats();
loadHomeRatings();
</script>
</body>
</html>