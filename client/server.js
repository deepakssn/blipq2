const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080; // App Engine will set PORT

// Serve static files from the 'build' directory
app.use(express.static(path.join(__dirname, 'build')));

// Handles any requests that don't match the ones above
// by sending back the main 'index.html' file.
// This is important for single-page applications (SPAs) like React.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend static server listening on port ${port}`);
});
