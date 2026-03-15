import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { CITIES } from "../src/lib/constants/locations";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// @ts-expect-error - version mismatch between @types/pg versions in @prisma/adapter-pg
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Start seeding ...`);

  const existingCount = await prisma.location.count();
  if (existingCount >= CITIES.length) {
    console.log(`Database already seeded (${existingCount} locations). Skipping.`);
    return;
  }

  for (const l of CITIES) {
    const existing = await prisma.location.findFirst({
      where: {
        city: l.name,
      },
    });

    if (!existing) {
      await prisma.location.create({
        data: {
          city: l.name,
          state: l.state,
          country: l.country,
          latitude: l.latitude,
          longitude: l.longitude,
          status: l.status,
        },
      });
      console.log(`Created location: ${l.name}`);
    } else {
      console.log(`Location already exists: ${l.name}`);
    }
  }
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
