#!/bin/bash
set -e

# Matikan history expansion kalau ada (biar "!important" aman)
set +H 2>/dev/null || true

PTERO_DIR="${PTERO_DIR:-/var/www/pterodactyl}"
WRAPPER="$PTERO_DIR/resources/views/templates/wrapper.blade.php"
PUB_CUSTOM="$PTERO_DIR/public/custom"
PUB_MEDIA="$PTERO_DIR/public/media"

RAW_BASE="https://raw.githubusercontent.com/sukaicecreamm-dev/themapremium/main"

CSS_URL="$RAW_BASE/premium.css"
JS_URL="$RAW_BASE/premium.js"
BGM_URL="${BGM_URL:-https://files.catbox.moe/nqmjhp.mp3}"

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing command: $1"; exit 1; }
}

need curl
need sed
need grep
need awk

echo "[1/7] Ensure folders..."
mkdir -p "$PUB_CUSTOM" "$PUB_MEDIA"

echo "[2/7] Download assets..."
curl -fsSL "$CSS_URL" -o "$PUB_CUSTOM/premium.css"
curl -fsSL "$JS_URL"  -o "$PUB_CUSTOM/premium.js"
curl -fsSL "$BGM_URL" -o "$PUB_MEDIA/bgm.mp3"

echo "[3/7] Patch wrapper (no double inject)..."
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
inject="$START
<link rel=\"stylesheet\" href=\"/custom/premium.css?v=$v\">
<script src=\"/custom/premium.js?v=$v\"></script>
$END"

if grep -q "</head>" "$WRAPPER"; then
  awk -v block="$inject" '
    /<\/head>/ && !done { print block; done=1 }
    { print }
  ' "$WRAPPER" > "$WRAPPER.tmp" && mv "$WRAPPER.tmp" "$WRAPPER"
else
  echo "WARN: </head> not found, appending inject at end."
  echo "$inject" >> "$WRAPPER"
fi

echo "[4/7] Clear cache..."
cd "$PTERO_DIR" || exit 1
php artisan optimize:clear >/dev/null 2>&1 || true
php artisan view:clear >/dev/null 2>&1 || true

echo "[5/7] Reload nginx..."
systemctl reload nginx >/dev/null 2>&1 || true

echo "[6/7] Verify wrapper lines..."
grep -n "custom/premium\.css\|custom/premium\.js" "$WRAPPER" || true

echo "[7/7] DONE v=$v"
