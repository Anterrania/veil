#!/usr/bin/env bash
# Build the Android APKs (debug + release) for this repo with the shared Anterrania stable key.
# Requires: Node 20+, JDK 21 (JAVA_HOME), Android SDK (ANDROID_HOME), and ~/keys/viper-release.properties or VIPER_SIGNING_PROPS.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/.." && pwd)"
source "$HERE/app.env"
cd "$ROOT"
if [ "${WEB_KIND}" = "tanstack" ]; then [ -d node_modules ] || npm ci --no-audit --no-fund; fi
# Static SPA build of the web app (server functions need the deployed server; UI runs on-device).
if [ "${WEB_KIND}" = "tanstack" ]; then
  sed -e 's/tanstackStart()/tanstackStart({ spa: { enabled: true } })/' -e 's/command === "build" || isPreview/false/' vite.config.ts > vite.config.viper.ts
  rm -rf dist && npx vite build --config vite.config.viper.ts >/dev/null && rm -f vite.config.viper.ts
  SRC=dist/client; cp $SRC/_shell.html $SRC/index.html
else SRC="${WEB_SRC}"; fi
rm -rf "$HERE/www" && mkdir -p "$HERE/www" && tar -C "$SRC" --exclude=./viper-apk --exclude=./.git --exclude=./.github --exclude=./node_modules -cf - . | tar -C "$HERE/www" -xf -
rm -rf "$HERE/www/.git" "$HERE/www/viper-apk"
VN=$(grep VERSION_NAME "$HERE/version.properties" | cut -d= -f2); VC=$(grep VERSION_CODE "$HERE/version.properties" | cut -d= -f2)
cp "$HERE/kit/viper-kit.js" "$HERE/kit/viper-kit.css" "$HERE/www/"
printf 'window.VIPER_KIT={name:%s,repo:%s,version:"%s",code:%s,build:"android"};\n' "\"$APP_NAME\"" "\"$UPDATE_REPO\"" "$VN" "$VC" > "$HERE/www/viper-kit-config.js"
python3 - "$HERE/www/index.html" <<'PY'
import sys;p=sys.argv[1];s=open(p,encoding='utf-8').read()
tag='<link rel="stylesheet" href="./viper-kit.css"><script src="./viper-kit-config.js"></script><script src="./viper-kit.js" defer></script>'
if 'viper-kit.js' not in s: s=s.replace('</head>',tag+'</head>',1)
open(p,'w',encoding='utf-8').write(s)
PY
cd "$HERE"; [ -d node_modules ] || npm install --no-audit --no-fund
npx cap sync android >/dev/null
cd android && ./gradlew -q assembleDebug assembleRelease
mkdir -p "$HERE/dist"
cp app/build/outputs/apk/debug/app-debug.apk "$HERE/dist/${APK_BASE}-v${VN}-debug.apk"
cp app/build/outputs/apk/release/app-release.apk "$HERE/dist/${APK_BASE}-v${VN}-release.apk"
ls -la "$HERE/dist"
