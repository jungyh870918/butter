<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ed55aac9-dd5d-4dcb-b1e0-c765664fafb9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Mobile (iOS / Android)

This app is also packaged as a native iOS and Android app with Capacitor
(bundle ID `com.butterapp.app`).

```bash
npm run sync          # web build (mobile mode) + cap sync
npm run open:ios      # Xcode
npm run open:android  # Android Studio
```

⚠️ The backend's `ALLOWED_ORIGINS` must include the app's WebView origins
(`capacitor://localhost` for iOS, `https://localhost` for Android) or every API
call from the app fails CORS.

See **[BUTTER-MOBILE.md](BUTTER-MOBILE.md)** for the full build/release guide.
