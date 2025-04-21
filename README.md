# Spotify Tracker

Track and control your Spotify listening activity. View top tracks, artists, search for music, and control playback.

## Quick Setup

### Local Development

1. **Install dependencies:**
```bash
npm install
npm install -g netlify-cli
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your Spotify credentials
```

3. **Get Spotify credentials:**
   - Create app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Set redirect URI to `http://localhost:3000/callback`
   - Add credentials to your `.env` file

4. **Run locally:**
```bash
netlify dev
# Open http://localhost:3000 in browser
```