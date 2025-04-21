require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const ALTERNATE_PORTS = [3001, 3002, 3003, 8080, 8081];

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Ensure assets are served correctly
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// API route to serve Spotify credentials
app.get('/api/credentials', (req, res) => {
  res.json({
    clientId: process.env.SPOTIFY_CLIENT_ID || '<YOUR_CLIENT>',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '<YOUR_SECRET>'
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'callback.html'));
});

// Handle all other routes for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy, trying alternate ports...`);
    tryAlternatePorts(0);
  } else {
    console.error(e);
  }
});

function tryAlternatePorts(index) {
  if (index >= ALTERNATE_PORTS.length) {
    console.error('All alternate ports are busy. Please specify an available port in .env file.');
    process.exit(1);
  }
  
  const alternatePort = ALTERNATE_PORTS[index];
  
  app.listen(alternatePort, () => {
    console.log(`Server running on http://localhost:${alternatePort}`);
  }).on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${alternatePort} is busy, trying next port...`);
      tryAlternatePorts(index + 1);
    } else {
      console.error(e);
    }
  });
} 