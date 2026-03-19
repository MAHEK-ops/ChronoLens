const { PrismaClient } = require('../generated/prisma');

// ─── Singleton PrismaClient ─────────────────────────────────────
// Prevents multiple instances during hot-reload in development.

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
