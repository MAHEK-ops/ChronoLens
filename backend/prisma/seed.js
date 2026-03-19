const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

const eventSources = [
  {
    name: 'Wikipedia',
    baseUrl: 'https://en.wikipedia.org/w/api.php',
    reliabilityWeight: 0.8,
    isActive: true,
  },
  {
    name: 'Wikidata',
    baseUrl: 'https://query.wikidata.org/sparql',
    reliabilityWeight: 0.9,
    isActive: true,
  },
  {
    name: 'GeoNames',
    baseUrl: 'http://api.geonames.org',
    reliabilityWeight: 0.7,
    isActive: true,
  },
];

async function main() {
  console.log('🌱 Start seeding EventSource table...');

  for (const source of eventSources) {
    const upsertedSource = await prisma.eventSource.upsert({
      where: { name: source.name },
      update: {},
      create: source,
    });
    console.log(`✅ Upserted source: ${upsertedSource.name} (weight: ${upsertedSource.reliabilityWeight})`);
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
