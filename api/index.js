const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config({ path: '.env.local' });

const app = express();
//Cambiar despues de pruebas
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Rutas importadas
const musicRoutes = require('./routes/music');
const authRoutes = require('./routes/auth');
const playlistRoutes = require('./routes/playlists');
const usersRoutes = require('./routes/users');
const avatarRoutes = require('./routes/avatar');

app.use('/api/music', musicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/avatar', avatarRoutes);

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

module.exports = app;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
