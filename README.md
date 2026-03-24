# Code Clarity AI

Frontend is deployed to Firebase Hosting, and backend API is deployed to Render.

## Local Development

1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example`
3. Run app:
   - `npm run dev`

This starts the Express server (`server.ts`) and Vite middleware in development mode.

## Environment Variables

Backend (Render):
- `GEMINI_API_KEY` (required)
- `GEMINI_MODEL` (optional, default: `gemini-3-flash-preview`)
- `CORS_ORIGINS` (optional, default: `*`)

Frontend (Firebase build):
- `VITE_API_URL` (required in production, points to Render URL)
- `VITE_API_URL_DEV` (optional for local dev; if empty app uses local `/api/*`)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID` (optional)

## Deploy Frontend to Firebase

1. Build:
   - `npm run build`
2. Deploy:
   - `firebase deploy --only hosting`

`firebase.json` is configured to serve `dist` and rewrite routes to `index.html`.

## Deploy Backend to Render

Use the root project as the Render service.

- Build command: `npm install`
- Start command: `npm run start`
- Runtime: Node

Set required environment variables in Render dashboard:
- `NODE_ENV=production`
- `GEMINI_API_KEY=...`
- `GEMINI_MODEL=gemini-3-flash-preview` (optional)
- `CORS_ORIGINS=https://<your-project>.web.app,https://<your-project>.firebaseapp.com`

## Smoke Test

After backend deploy, verify:
- `GET <render-url>/api/health` returns status `ok`.

After frontend deploy, verify:
- `VITE_API_URL` points to Render URL.
- Browser calls `<render-url>/api/explain` successfully.
