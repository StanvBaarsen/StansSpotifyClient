# Spotify Tracker

A web application that allows you to track and control your Spotify listening activity. View your top tracks and artists, search for songs, and control playback all from one interface.

## Features

- **Authentication**: Securely login with your Spotify account
- **Playback Control**: Play, pause, skip tracks, and toggle shuffle mode
- **Top Content**: View your most listened artists and tracks from the last 4 weeks
- **Search**: Search for artists, tracks, and albums and play them directly

## Screenshots

![Spotify Tracker Screenshot](public/assets/images/header.jpeg)

## Technologies Used

- Node.js
- Express
- Spotify Web API
- HTML/CSS/JavaScript

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/spotify-tracker.git
cd spotify-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your Spotify API credentials:
```
PORT=3000
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

5. Get your Spotify API credentials:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Create a new application
   - Set the redirect URI to `http://localhost:3000/callback`
   - Copy your Client ID and Client Secret to your `.env` file

6. Update the Spotify credentials in `/public/assets/js/spotify.js`:
   - Replace `<YOUR_CLIENT>` with your Spotify Client ID
   - Replace `<YOUR_SECRET>` with your Spotify Client Secret

## Usage

1. Start the server:
```bash
npm start
```

2. Development mode (with auto-restart):
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

Note: If port 3000 is already in use, the server will automatically try alternate ports (3001, 3002, 3003, 8080, 8081) and display the URL in the console.

## Project Structure

```
spotify-tracker/
├── public/                  # Static files
│   ├── assets/              # Assets organized by type
│   │   ├── css/             # CSS stylesheets
│   │   ├── js/              # JavaScript files
│   │   └── images/          # Images and icons
│   ├── index.html           # Main application page
│   └── callback.html        # OAuth callback page
├── server.js                # Express server configuration
├── .env                     # Environment variables (git-ignored)
├── .env.example             # Example environment variables template
├── package.json             # Project dependencies and scripts
└── README.md                # Project documentation
```

## Troubleshooting

### Port Already in Use
If you see an error like `Error: listen EADDRINUSE: address already in use :::3000`, the server will automatically try alternate ports. If all ports are busy, you can:

1. Change the PORT in your `.env` file to an available port
2. Find and stop the process using port 3000:
   ```
   # On macOS/Linux
   lsof -i :3000
   kill -9 <PID>
   
   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
