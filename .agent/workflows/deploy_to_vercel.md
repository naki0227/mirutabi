---
description: How to deploy Mirutabi to Vercel
---

# Deploying Mirutabi to Vercel

Follow these steps to deploy your application to the internet using Vercel.

## Prerequisites
- A [GitHub](https://github.com/) account.
- A [Vercel](https://vercel.com/) account (you can sign up with GitHub).

## Step 1: Push to GitHub
1. Create a new repository on GitHub (e.g., `mirutabi`).
2. Push your local code to this repository.
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git remote add origin https://github.com/YOUR_USERNAME/mirutabi.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Import to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Select your `mirutabi` repository and click **"Import"**.

## Step 3: Configure Project
1. **Framework Preset**: Next.js (should be auto-detected).
2. **Root Directory**: `./` (default).
3. **Environment Variables**:
   Expand the "Environment Variables" section and add the following keys from your `.env.local`:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | (Your Firebase API Key) |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | (Your Firebase Auth Domain) |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | (Your Firebase Project ID) |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | (Your Firebase Storage Bucket) |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (Your Sender ID) |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | (Your App ID) |
   | `GEMINI_API_KEY` | (Your Gemini API Key) |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | (Your Google Maps API Key) |
   | `GOOGLE_MAPS_API_KEY` | (Same as above) |
   | `SPOTIFY_CLIENT_ID` | (Your Spotify Client ID) |
   | `SPOTIFY_CLIENT_SECRET` | (Your Spotify Client Secret) |
   | `NEXT_PUBLIC_BASE_URL` | `https://your-project-name.vercel.app` (You can set this after deployment if unsure) |

## Step 4: Deploy
1. Click **"Deploy"**.
2. Wait for the build to complete.
3. Once finished, you will get a URL (e.g., `https://mirutabi.vercel.app`).

## Step 5: Post-Deployment Setup
1. **Spotify Dashboard**:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
   - Edit your app settings.
   - Add your new Vercel URL to **Redirect URIs**:
     `https://your-project-name.vercel.app/api/spotify/callback`
   - Save changes.

2. **Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Go to **Authentication** -> **Settings** -> **Authorized domains**.
   - Add your Vercel domain (e.g., `mirutabi.vercel.app`).

3. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Go to **APIs & Services** -> **Credentials**.
   - Edit your API Key restrictions to allow your Vercel domain (if you set HTTP referer restrictions).
