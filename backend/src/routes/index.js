const express = require('express');
const router = express.Router();

// ─── Health Check ───────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
  });
});

module.exports = router;
