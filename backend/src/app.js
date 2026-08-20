require('dotenv').config();

const cors = require('cors');
const express = require('express');
const connectDatabase = require('./config/db');
const pinRoutes = require('./routes/pinRoutes');

const app = express();

function getCorsOptions() {
  const configuredOrigins = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.includes('*')) {
    return { origin: true };
  }

  return {
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin is not allowed by CORS'));
      }
    },
  };
}

app.disable('x-powered-by');
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/pins', pinRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (error.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  await connectDatabase();
  return app.listen(port, () => {
    console.log(`MapPin API listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start MapPin API:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };

