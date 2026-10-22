#!/usr/bin/env bash
# Pariscope Linux installer - Velocity Tech
set -euo pipefail
REPO="${PARISCOPE_REPO:-SINOBI71/pariscope-linux}"
REF="${PARISCOPE_REF:-main}"
[ "$(id -u)" -eq 0 ] || { echo "Please run with sudo."; exit 1; }

echo "==> Installing requirements"
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y curl ca-certificates tar iputils-ping
  if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y curl tar iputils nodejs npm
elif command -v pacman >/dev/null 2>&1; then
  pacman -Sy --noconfirm curl tar iputils nodejs npm
else
  echo "Unsupported Linux. Install Node.js 18+ and re-run."; exit 1
fi

echo "==> Downloading Pariscope"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
curl -fsSL "https://github.com/$REPO/archive/$REF.tar.gz" | tar -xz -C "$TMP"
SRC="$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -1)"

id pariscope >/dev/null 2>&1 || useradd --system --home /var/lib/pariscope --shell /usr/sbin/nologin pariscope
systemctl stop pariscope 2>/dev/null || true
rm -rf /opt/pariscope
mkdir -p /opt/pariscope /var/lib/pariscope
cp -r "$SRC/app" /opt/pariscope/app
install -Dm644 "$SRC/assets/pariscope.png" /usr/share/icons/hicolor/256x256/apps/pariscope.png
install -Dm644 "$SRC/assets/pariscope.desktop" /usr/share/applications/pariscope.desktop
install -Dm644 "$SRC/assets/pariscope.service" /etc/systemd/system/pariscope.service
install -Dm755 "$SRC/assets/pariscope" /usr/local/bin/pariscope
install -Dm755 "$SRC/assets/pariscope-app" /usr/bin/pariscope-app
update-desktop-database /usr/share/applications >/dev/null 2>&1 || true

echo "==> Installing dependencies (1-2 minutes)"
( cd /opt/pariscope/app && npm install --omit=dev --no-audit --no-fund )
chown -R pariscope:pariscope /opt/pariscope /var/lib/pariscope

systemctl daemon-reload
systemctl enable --now pariscope
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -f /usr/share/icons/hicolor >/dev/null 2>&1 || true

echo
echo "Pariscope is running:  http://localhost:4000"
echo "Commands: pariscope {start|stop|restart|status|logs|open|update|uninstall}"