require('dotenv').config();
const app = require('./app');

const { connectRedis } = require('./db/redis');

const PORT = process.env.PORT || 3000;

// Initialize Database integrations on startup
connectRedis().then(() => {
  app.listen(PORT, () => {
    console.log(`🔭 ChronoLens backend running on http://localhost:${PORT}`);
    console.log(`   Health check → http://localhost:${PORT}/api/health`);
  });
});
