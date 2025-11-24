# Building APK for Nogalss Mobile App

## Option 1: Using EAS Build (Cloud - Recommended)

EAS Build is Expo's cloud build service. It's the easiest way to build an APK.

### Steps:

1. **Make sure you're logged in:**
   ```bash
   eas login
   ```

2. **Initialize the project (first time only):**
   ```bash
   eas init
   ```
   - When prompted, type `y` to create a new EAS project
   - This will automatically update your `app.json` with a project ID

3. **Build the APK:**
   ```bash
   eas build --platform android --profile preview
   ```
   - This will build an APK file
   - The build will happen on Expo's servers
   - You'll get a download link when it's done

4. **Download the APK:**
   - Visit https://expo.dev/accounts/[your-account]/projects/nogalss-mobile/builds
   - Download the APK file
   - Transfer it to your Android device
   - Install it (you may need to enable "Install from unknown sources" in Android settings)

### Build Time:
- First build: ~15-20 minutes
- Subsequent builds: ~10-15 minutes

---

## Option 2: Local Build (Advanced)

If you prefer to build locally on your machine:

### Prerequisites:
- Android Studio installed
- Android SDK configured
- Java JDK installed
- Environment variables set (ANDROID_HOME, JAVA_HOME)

### Steps:

1. **Install Android dependencies:**
   ```bash
   cd nogalss-mobile-rn
   npx expo install --fix
   ```

2. **Prebuild native code:**
   ```bash
   npx expo prebuild --platform android
   ```

3. **Build the APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Find the APK:**
   - Location: `android/app/build/outputs/apk/release/app-release.apk`

---

## Quick Start Script

You can also use the provided script:

```bash
cd nogalss-mobile-rn
./build-apk.sh
```

---

## Troubleshooting

### "EAS project not configured"
- Run `eas init` first to create the project

### "Invalid UUID appId"
- Remove the `projectId` from `app.json` and let EAS generate a new one

### Build fails with dependency errors
- Run `npm install` in the `nogalss-mobile-rn` directory
- Run `npx expo install --fix` to fix dependency versions

### APK installation fails on device
- Enable "Install from unknown sources" in Android settings
- Make sure the APK is for the correct architecture (arm64-v8a, armeabi-v7a, x86_64)

---

## Notes

- The APK built with `preview` profile is suitable for testing
- For production releases, use the `production` profile
- APK files are typically 30-50 MB in size
- Make sure your `API_BASE_URL` in `src/config/api.ts` points to the correct server

