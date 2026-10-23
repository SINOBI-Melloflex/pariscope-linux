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

if ! command -v google-chrome >/dev/null 2>&1 && ! command -v chromium >/dev/null 2>&1 && ! command -v chromium-browser >/dev/null 2>&1 && ! command -v microsoft-edge >/dev/null 2>&1 && ! command -v brave-browser >/dev/null 2>&1; then
  echo "==> Installing a browser for app-window mode (optional)"
  if command -v apt-get >/dev/null 2>&1; then apt-get install -y chromium || apt-get install -y chromium-browser || true
  elif command -v dnf >/dev/null 2>&1; then dnf install -y chromium || true
  elif command -v pacman >/dev/null 2>&1; then pacman -S --noconfirm chromium || true
  fi
fi
echo "==> Installing voice engine for spoken alerts (optional)"
if command -v apt-get >/dev/null 2>&1; then
  apt-get install -y speech-dispatcher espeak-ng speech-dispatcher-espeak-ng || apt-get install -y speech-dispatcher espeak-ng || true
elif command -v dnf >/dev/null 2>&1; then dnf install -y speech-dispatcher espeak-ng || true
elif command -v pacman >/dev/null 2>&1; then pacman -S --noconfirm speech-dispatcher espeak-ng || true
fi
echo "==> Downloading Pariscope"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
curl -fsSL "https://github.com/$REPO/archive/$REF.tar.gz" | tar -xz -C "$TMP"
SRC="$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -1)"

id pariscope >/dev/null 2>&1 || useradd --system --home /var/lib/pariscope --shell /usr/sbin/nologin pariscope
systemctl stop pariscope 2>/dev/null || true
systemctl stop pariscope-alerts 2>/dev/null || true
rm -rf /opt/pariscope
mkdir -p /opt/pariscope /var/lib/pariscope
cp -r "$SRC/app" /opt/pariscope/app
install -Dm644 "$SRC/assets/pariscope.png" /usr/share/icons/hicolor/256x256/apps/pariscope.png
install -Dm644 "$SRC/assets/pariscope.png" /usr/share/pixmaps/pariscope.png
install -Dm644 "$SRC/assets/pariscope.desktop" /usr/share/applications/pariscope.desktop
install -Dm644 "$SRC/assets/pariscope.service" /etc/systemd/system/pariscope.service
install -Dm644 "$SRC/assets/pariscope-update.service" /etc/systemd/system/pariscope-update.service
install -Dm644 "$SRC/assets/pariscope-update.path" /etc/systemd/system/pariscope-update.path
install -Dm755 "$SRC/assets/pariscope-update-run" /usr/local/sbin/pariscope-update-run
install -Dm644 "$SRC/assets/pariscope-alerts.service" /etc/systemd/system/pariscope-alerts.service
install -Dm755 "$SRC/assets/pariscope" /usr/local/bin/pariscope
install -Dm755 "$SRC/assets/pariscope-app" /usr/bin/pariscope-app
update-desktop-database /usr/share/applications >/dev/null 2>&1 || true

echo "==> Installing dependencies (1-2 minutes)"
( cd /opt/pariscope/app && npm install --omit=dev --no-audit --no-fund )
chown -R pariscope:pariscope /opt/pariscope /var/lib/pariscope

systemctl daemon-reload
systemctl enable --now pariscope
systemctl enable --now pariscope-update.path || true
systemctl enable pariscope-alerts >/dev/null 2>&1 || true
systemctl restart pariscope-alerts || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -f /usr/share/icons/hicolor >/dev/null 2>&1 || true

echo
echo "Pariscope is running:  http://localhost:4000"
echo "Commands: pariscope {start|stop|restart|status|logs|open|update|uninstall}"