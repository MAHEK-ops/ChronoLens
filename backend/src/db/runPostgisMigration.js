/**
 * Runs the PostGIS raw SQL migration.
 * Adds geometry columns + spatial indexes to Location and HistoricalEvent.
 *
 * Usage: npm run migrate:postgis
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('./prisma');

async function runPostgisMigration() {
  const sqlPath = path.join(__dirname, 'migrations', 'add_postgis_columns.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Split on semicolons and run each statement separately
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log('Running PostGIS migration...\n');

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      // Show first line of each statement as a label
      const label = statement.split('\n').find((l) => !l.startsWith('--') && l.trim()) || statement;
      console.log(`${label.trim().substring(0, 60)}`);
    } catch (err) {
      console.error(`Failed: ${statement.substring(0, 60)}`);
      console.error(`${err.message}`);
    }
  }

  console.log('\n🏁 PostGIS migration complete.');
}

runPostgisMigration()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
