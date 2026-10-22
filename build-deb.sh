#!/usr/bin/env bash
set -euo pipefail
VER="$(tr -d ' \r\n' < app/version.txt)"
P="build/pariscope_${VER}_amd64"
rm -rf build; mkdir -p "$P/DEBIAN" "$P/opt/pariscope" "$P/usr/share/icons/hicolor/256x256/apps" "$P/usr/share/applications" "$P/lib/systemd/system" "$P/usr/bin"
cp -r app "$P/opt/pariscope/app"
( cd "$P/opt/pariscope/app" && npm install --omit=dev --no-audit --no-fund )
install -m644 assets/pariscope.png "$P/usr/share/icons/hicolor/256x256/apps/pariscope.png"
install -m644 assets/pariscope.desktop "$P/usr/share/applications/pariscope.desktop"
install -m644 assets/pariscope.service "$P/lib/systemd/system/pariscope.service"
install -m755 assets/pariscope "$P/usr/bin/pariscope"
install -m755 assets/pariscope-app "$P/usr/bin/pariscope-app"
cat > "$P/DEBIAN/control" <<EOF
Package: pariscope
Version: $VER
Section: net
Priority: optional
Architecture: amd64
Depends: nodejs (>= 18), iputils-ping, curl
Maintainer: Velocity Tech <support@velocitytech.top>
Homepage: https://velocitytech.top
Description: Pariscope network monitoring and infrastructure map
 Live link monitoring, SNMP, alerts and 3D infrastructure map.
EOF
cat > "$P/DEBIAN/postinst" <<'EOF'
#!/bin/sh
set -e
id pariscope >/dev/null 2>&1 || useradd --system --home /var/lib/pariscope --shell /usr/sbin/nologin pariscope
mkdir -p /var/lib/pariscope
chown -R pariscope:pariscope /opt/pariscope /var/lib/pariscope
systemctl daemon-reload || true
systemctl enable --now pariscope || true
echo "Pariscope is running: http://localhost:4000"
EOF
cat > "$P/DEBIAN/prerm" <<'EOF'
#!/bin/sh
systemctl disable --now pariscope 2>/dev/null || true
EOF
chmod 755 "$P/DEBIAN/postinst" "$P/DEBIAN/prerm"
dpkg-deb --build --root-owner-group "$P"