# Quick APK Build Instructions

## Step 1: Initialize EAS Project (One-time setup)

Run this command and follow the prompts:

```bash
cd nogalss-mobile-rn
eas init
```

When asked:
- **"Would you like to create a project for @mexyik/nogalss-mobile?"** → Type `y` and press Enter
- This will automatically create an EAS project and update your `app.json`

## Step 2: Build the APK

After initialization, run:

```bash
eas build --platform android --profile preview
```

This will:
1. Upload your code to Expo's servers
2. Build the APK (takes ~15-20 minutes)
3. Provide a download link when complete

## Step 3: Download and Install

1. Visit the build page (link will be shown after build completes)
2. Download the APK file
3. Transfer to your Android device
4. Install (enable "Install from unknown sources" if needed)

---

## Alternative: All-in-One Command

If you want to do it all at once, run these commands in sequence:

```bash
cd nogalss-mobile-rn

# Initialize (type 'y' when prompted)
eas init

# Build the APK
eas build --platform android --profile preview
```

---

## Important Notes

- Make sure you're logged in: `eas login`
- The first build takes longer (~20 minutes)
- APK will be ~30-50 MB
- Make sure your API URL in `src/config/api.ts` is correct for production

