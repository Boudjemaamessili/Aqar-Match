#!/bin/bash
# سكربت بناء أرشيف الكود المصدري لمنصة عقار Match
# يُنتج: /home/z/my-project/download/aqar-match-source.zip

set -e

PROJECT_DIR="/home/z/my-project"
OUTPUT_ZIP="$PROJECT_DIR/download/aqar-match-source.zip"
STAGE_DIR="/tmp/aqar-source-stage"

# تنظيف
rm -rf "$STAGE_DIR"
rm -f "$OUTPUT_ZIP"
mkdir -p "$STAGE_DIR/aqar-match-source"

echo "[1/5] نسخ كود Next.js..."
cd "$PROJECT_DIR"
# نسخ الملفات والمجلدات الأساسية مع استثناءات
tar --exclude='./node_modules' \
    --exclude='./.next' \
    --exclude='./.git' \
    --exclude='./.zscripts' \
    --exclude='./tool-results' \
    --exclude='./upload' \
    --exclude='./dev.log' \
    --exclude='./download' \
    --exclude='./bun.lock' \
    --exclude='./skills' \
    --exclude='./examples' \
    --exclude='./mini-services' \
    --exclude='./worklog.md' \
    -cf - . | tar -xf - -C "$STAGE_DIR/aqar-match-source/"

echo "[2/5] نسخ skill aqar-match-platform..."
mkdir -p "$STAGE_DIR/aqar-match-source/aqar-match-platform"
# استخراج skill من ملف .skill (zip)
TMP_SKILL_EXTRACT="/tmp/aqar-skill-extract-v2"
rm -rf "$TMP_SKILL_EXTRACT"
mkdir -p "$TMP_SKILL_EXTRACT"
unzip -q "$PROJECT_DIR/download/aqar-match-platform.skill" -d "$TMP_SKILL_EXTRACT/"
cp -r "$TMP_SKILL_EXTRACT/aqar-match-platform/"* "$STAGE_DIR/aqar-match-source/aqar-match-platform/"

echo "[3/5] نسخ لقطات الشاشة..."
mkdir -p "$STAGE_DIR/aqar-match-source/screenshots"
for png in home-page-screenshot.png no-match-result.png dashboard-page.png login-page-entry.png login-page-2fa.png dashboard-owner.png seeker-redirect.png; do
  cp "$PROJECT_DIR/download/$png" "$STAGE_DIR/aqar-match-source/screenshots/" 2>/dev/null || true
done

echo "[4/5] نسخ README..."
cp "$PROJECT_DIR/download/README.md" "$STAGE_DIR/aqar-match-source/README.md"

echo "[5/5] ضغط الأرشيف..."
cd "$STAGE_DIR"
zip -qr "$OUTPUT_ZIP" aqar-match-source/

# تنظيف
rm -rf "$STAGE_DIR"

# عرض النتيجة
echo ""
echo "✅ تم بناء الأرشيف بنجاح:"
ls -lh "$OUTPUT_ZIP"
echo ""
echo "المحتويات:"
unzip -l "$OUTPUT_ZIP" | tail -5
