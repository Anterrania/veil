# VEIL Android APK (Viper Kit)

This folder wraps the web app as an Android APK with Capacitor 7 and adds the Anterrania standard layer (`kit/`). Tap the gold ✦ button in the app to reach it:
- **Look:** the magenta, gold, black and platinum glam frame with sparkle. Animations are on by default. Reduce motion turns them off, and the OS reduced-motion preference is respected.
- **Brain Cell:** an on-device AI assistant. It's rule-based (keyword and time-of-day suggestions), sends nothing over the network, and isn't a large language model.
- **Developer options:** About → tap Build number 7 times. Inside:
  - USB debugging status and a link to Android settings. Apps can't change this setting themselves.
  - FPS overlay
  - Log view and export
  - Cache clear
  - Backup and restore
  - Reset to defaults
  - Feature flags
  - Version info
- **Updates:** checks the latest GitHub Release of Anterrania/veil and downloads the APK. Android always asks you to confirm the install. While the repo is private, the unauthenticated check can't see releases.

**Build:** run `viper-apk/build-apk.sh`. It needs JDK 21, the Android SDK and the shared stable key at `~/keys/viper-release.properties` (or `VIPER_SIGNING_PROPS`). The key is never in git. Bump `version.properties` (VERSION_CODE) for each release.

**Limits:** the APK bundles a static SPA build of the UI. Server functions (database, auth, AI endpoints) need the app's deployed server and won't work offline.
