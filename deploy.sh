#!/usr/bin/env bash
#
# Deploy de FrontendTOP sobre Apache2 (servido en /frontend-top/).
#
# Uso:
#   ./deploy.sh              → build de producción + copia a DEST + comprobación
#   ./deploy.sh --dry-run    → build + muestra qué copiaría/borraría, sin tocar DEST
#   ./deploy.sh --skip-build → copia el último build de dist/ sin recompilar
#
# Variables (se pueden sobrescribir desde el entorno):
#   DEST=/var/www/html/frontend-top  BASE_HREF=/frontend-top/  URL_BASE=http://localhost
#
# Se conservan en el servidor (nunca se sobrescriben):
#   - assets/configuraciones.js → URLs de backend/Engine de producción
#   - .htaccess                  → reescritura de rutas de la SPA a index.html
#
set -euo pipefail

DEST="${DEST:-/var/www/html/frontend-top}"
BASE_HREF="${BASE_HREF:-/frontend-top/}"
URL_BASE="${URL_BASE:-http://localhost}"

DRY_RUN=false
SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --dry-run)    DRY_RUN=true ;;
    --skip-build) SKIP_BUILD=true ;;
    -h|--help)    sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Opción desconocida: $arg (usa --help)" >&2; exit 1 ;;
  esac
done

# Ejecutar siempre desde la raíz del proyecto
cd "$(dirname "$(readlink -f "$0")")"
BUILD_DIR="dist/frontend-top/browser"

info()  { echo -e "\033[1;34m==>\033[0m $*"; }
aviso() { echo -e "\033[1;33m[AVISO]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; exit 1; }

# ─── Comprobaciones previas ──────────────────────────────────────────────────
[[ -d "$DEST" ]] || error "No existe el directorio destino: $DEST"
[[ -w "$DEST" ]] || error "Sin permiso de escritura en $DEST"
command -v rsync >/dev/null || error "rsync no está instalado (sudo apt install rsync)"

# ─── Build ───────────────────────────────────────────────────────────────────
if $SKIP_BUILD; then
  info "Omitiendo build, se usa el contenido actual de $BUILD_DIR"
else
  info "Build de producción (base-href $BASE_HREF)"
  npx ng build --base-href "$BASE_HREF"
fi
[[ -f "$BUILD_DIR/index.html" ]] || error "No se encuentra $BUILD_DIR/index.html"
grep -q "<base href=\"$BASE_HREF\">" "$BUILD_DIR/index.html" \
  || error "El index.html de $BUILD_DIR no tiene <base href=\"$BASE_HREF\"> (¿build antiguo? quita --skip-build)"

# ─── Copia ───────────────────────────────────────────────────────────────────
RSYNC_OPTS=(-rltv --omit-dir-times --delete --exclude assets/configuraciones.js --exclude .htaccess)
if $DRY_RUN; then
  info "SIMULACIÓN: cambios que se harían en $DEST"
  rsync "${RSYNC_OPTS[@]}" --dry-run "$BUILD_DIR/" "$DEST/"
  exit 0
fi

info "Copiando a $DEST"
rsync "${RSYNC_OPTS[@]}" "$BUILD_DIR/" "$DEST/"

# Primer deploy: crear los ficheros que se conservan si todavía no existen
if [[ ! -f "$DEST/assets/configuraciones.js" ]]; then
  cp "$BUILD_DIR/assets/configuraciones.js" "$DEST/assets/configuraciones.js"
  aviso "Creado $DEST/assets/configuraciones.js desde el repo (apunta a localhost): edítalo con las URLs de producción"
fi
if [[ ! -f "$DEST/.htaccess" ]]; then
  cat > "$DEST/.htaccess" <<EOF
RewriteEngine On
# If an existing asset or directory is requested go to it as it is
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# If the requested resource doesn't exist, use index.html
RewriteRule ^ ${BASE_HREF}index.html
EOF
  aviso "Creado $DEST/.htaccess (requiere AllowOverride FileInfo en Apache)"
fi

# ─── Comprobación ────────────────────────────────────────────────────────────
info "Comprobando $URL_BASE$BASE_HREF"
MAIN_JS="$(grep -o 'main-[A-Z0-9]*\.js' "$BUILD_DIR/index.html" | head -1)"
fallos=0
for ruta in "" "demo-modulos" "assets/configuraciones.js" "$MAIN_JS"; do
  codigo="$(curl -s -o /dev/null -w '%{http_code}' "$URL_BASE$BASE_HREF$ruta" || true)"
  if [[ "$codigo" == "200" ]]; then
    echo "  OK   $codigo  $BASE_HREF$ruta"
  else
    echo "  FALLO $codigo  $BASE_HREF$ruta"
    fallos=$((fallos + 1))
  fi
done
(( fallos == 0 )) || error "$fallos comprobación(es) fallida(s)"

info "Deploy completado. Recarga el navegador con Ctrl+F5."
