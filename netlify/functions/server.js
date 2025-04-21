const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

// Handle all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public', 'index.html'));
});

// Export the serverless function
module.exports.handler = serverless(app); 