const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const qaRoutes = require('./routes/qa');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', qaRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
