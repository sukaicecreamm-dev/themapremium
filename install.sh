#!/usr/bin/env bash
set -euo pipefail
set +H 2>/dev/null || true  # matiin history expansion (biar "!important" gak error)

PTERO_DIR="${PTERO_DIR:-/var/www/pterodactyl}"
WRAPPER="$PTERO_DIR/resources/views/templates/wrapper.blade.php"
PUB_CUSTOM="$PTERO_DIR/public/custom"
PUB_MEDIA="$PTERO_DIR/public/media"

# ==== GANTI INI sesuai GitHub RAW kamu ====
RAW_BASE="${RAW_BASE:-https://raw.githubusercontent.com/USER/REPO/main}"

CSS_URL="${CSS_URL:-$RAW_BASE/premium.css}"
JS_URL="${JS_URL:-$RAW_BASE/premium.js}"
BGM_URL="${BGM_URL:-https://files.catbox.moe/nqmjhp.mp3}"
# ========================================

need(){ command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1"; exit 1; }; }
need curl; need sed; need grep; need awk

if [[ ! -d "$PTERO_DIR" ]]; then
  echo "Pterodactyl dir not found: $PTERO_DIR"
  exit 1
fi

echo "[1/6] Ensure folders..."
mkdir -p "$PUB_CUSTOM" "$PUB_MEDIA"

echo "[2/6] Download assets..."
curl -fsSL "$CSS_URL" -o "$PUB_CUSTOM/premium.css"
curl -fsSL "$JS_URL"  -o "$PUB_CUSTOM/premium.js"
curl -fsSL "$BGM_URL" -o "$PUB_MEDIA/bgm.mp3"

echo "[3/6] Patch wrapper (no double)..."
# hapus block lama kalau ada (pakai marker)
START="<!-- RP_PREMIUM_INJECT_START -->"
END="<!-- RP_PREMIUM_INJECT_END -->"

tmp="$(mktemp)"
awk -v s="$START" -v e="$END" '
  BEGIN{skip=0}
  $0 ~ s {skip=1; next}
  $0 ~ e {skip=0; next}
  skip==0 {print}
' "$WRAPPER" > "$tmp"
cat "$tmp" > "$WRAPPER"
rm -f "$tmp"

v="$(date +%s)"
inject=$(cat <<EOF
$START
<link rel="stylesheet" href="/custom/premium.css?v=$v">
<script src="/custom/premium.js?v=$v"></script>
$END
EOF
)

# sisipkan sebelum </head>
if grep -q "</head>" "$WRAPPER"; then
  awk -v block="$inject" '
    /<\/head>/ && !done { print block; done=1 }
    { print }
  ' "$WRAPPER" > "$WRAPPER.tmp" && mv "$WRAPPER.tmp" "$WRAPPER"
else
  echo "WARN: </head> not found, appending inject at end."
  echo "$inject" >> "$WRAPPER"
fi

echo "[4/6] Clear caches..."
cd "$PTERO_DIR" || exit 1
php artisan optimize:clear >/dev/null 2>&1 || true
php artisan view:clear >/dev/null 2>&1 || true

echo "[5/6] Reload nginx..."
systemctl reload nginx >/dev/null 2>&1 || true

echo "[6/6] Verify..."
echo "Wrapper:"
grep -n "custom/premium\.css\|custom/premium\.js" "$WRAPPER" || true
echo "CSS head:"
head -n 1 "$PUB_CUSTOM/premium.css" || true
echo "JS head:"
head -n 1 "$PUB_CUSTOM/premium.js" || true
echo "BGM:"
ls -lah "$PUB_MEDIA/bgm.mp3" || true

echo "DONE v=$v"
