# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API** or **Google Identity Services API**
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **OAuth client ID**
6. Choose **Web application**
7. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `http://localhost:5173` (for Vite dev server)
   - Your production domain (e.g., `https://your-app.vercel.app`)
8. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - `http://localhost:5173` (for Vite dev server)
   - Your production domain
9. Copy the **Client ID** (it looks like: `123456789-abc123def456.apps.googleusercontent.com`)

## Step 2: Add Client ID to Environment Variables

1. Create or edit `.env` file in the root directory
2. Add your Google Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
3. Restart your development server

## Step 3: Test Google Sign-In

1. Start your frontend: `npm run dev`
2. Click "Sign in with Google" button
3. Select your Google account
4. You'll be automatically logged in and a user will be created if it's your first time

## Notes

- New Google users are automatically assigned the **Teacher** role
- They are assigned to the first active school in the database
- If no school exists, a default school is created automatically
- You can change the user's role later through the admin panel

