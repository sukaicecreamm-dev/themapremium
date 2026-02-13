#!/usr/bin/env bash
# RP_INSTALL_V12_FINAL
set -euo pipefail

# --- CRLF killer: kalau file ada \r, eksekusi ulang versi yang sudah dibersihkan ---
if grep -q $'\r' "$0" 2>/dev/null; then
  tmp_self="$(mktemp)"
  tr -d '\r' < "$0" > "$tmp_self"
  chmod +x "$tmp_self"
  exec /usr/bin/env bash "$tmp_self" "$@"
fi

# Pastikan jalan di bash (kalau ada yang nge-run pakai sh)
if [ -z "${BASH_VERSION:-}" ]; then
  exec /usr/bin/env bash "$0" "$@"
fi

# Matikan history expansion (biar "!important" aman)
set +H 2>/dev/null || true

PTERO_DIR="${PTERO_DIR:-/var/www/pterodactyl}"
WRAPPER="$PTERO_DIR/resources/views/templates/wrapper.blade.php"
PUB_CUSTOM="$PTERO_DIR/public/custom"
PUB_MEDIA="$PTERO_DIR/public/media"

RAW_BASE="${RAW_BASE:-https://raw.githubusercontent.com/sukaicecreamm-dev/themapremium/main}"
CSS_URL="${CSS_URL:-$RAW_BASE/premium.css}"
JS_URL="${JS_URL:-$RAW_BASE/premium.js}"
BGM_URL="${BGM_URL:-https://files.catbox.moe/nqmjhp.mp3}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing command: $1"; exit 1; }; }

need bash
need curl
need sed
need grep
need awk
need mktemp
need date

# sanity check path
if [ ! -d "$PTERO_DIR" ]; then
  echo "ERROR: PTERO_DIR tidak ditemukan: $PTERO_DIR"
  echo "Tip: PTERO_DIR=/var/www/pterodactyl curl -fsSL <install.sh> | tr -d '\r' | bash"
  exit 1
fi
if [ ! -f "$WRAPPER" ]; then
  echo "ERROR: wrapper.blade.php tidak ditemukan: $WRAPPER"
  exit 1
fi

echo "[1/9] Ensure folders..."
mkdir -p "$PUB_CUSTOM" "$PUB_MEDIA"

echo "[2/9] Download assets..."
curl -fsSL "$CSS_URL" -o "$PUB_CUSTOM/premium.css"
curl -fsSL "$JS_URL"  -o "$PUB_CUSTOM/premium.js"
curl -fsSL "$BGM_URL" -o "$PUB_MEDIA/bgm.mp3"

echo "[3/9] Quick check downloaded sizes..."
wc -c "$PUB_CUSTOM/premium.css" "$PUB_CUSTOM/premium.js" "$PUB_MEDIA/bgm.mp3" || true

echo "[4/9] Backup wrapper..."
bak="$WRAPPER.bak.$(date +%Y%m%d_%H%M%S)"
cp -a "$WRAPPER" "$bak"
echo "Backup: $bak"

echo "[5/9] Patch wrapper (no double inject)..."
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

# juga hapus kalau ada include premium nyangkut di luar block
sed -i '/\/custom\/premium\.css/d' "$WRAPPER"
sed -i '/\/custom\/premium\.js/d'  "$WRAPPER"

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

echo "[6/9] Clear cache (if php exists)..."
cd "$PTERO_DIR" || exit 1
if command -v php >/dev/null 2>&1; then
  php artisan optimize:clear >/dev/null 2>&1 || true
  php artisan view:clear >/dev/null 2>&1 || true
else
  echo "WARN: php not found, skip artisan cache clear."
fi

echo "[7/9] Reload nginx (best effort)..."
systemctl reload nginx >/dev/null 2>&1 || true

echo "[8/9] Verify wrapper lines..."
grep -n "custom/premium\.css\|custom/premium\.js" "$WRAPPER" || true

echo "[9/9] DONE v=$v"
echo "Notes:"
echo "- Music path: /media/bgm.mp3 (no domain)"
echo "- If music not auto-play on iOS/Android: user must tap once (browser rule)"
echo "Test with your domain:"
echo '  curl -s https://YOUR_DOMAIN/auth/login | grep -n "premium\.css\|premium\.js"'
