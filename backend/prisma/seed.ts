import { PrismaClient } from "@prisma/client";
import { cagarBudayaData } from "./data/cagarBudaya";

const prisma = new PrismaClient();

async function main() {
  await prisma.gallery.deleteMany();
  await prisma.cagarBudaya.deleteMany();

  await prisma.cagarBudaya.createMany({
    data: cagarBudayaData,
  });

  const cagarBudaya = await prisma.cagarBudaya.findMany({
    where: {
      thumbnail: {
        not: null,
      },
    },
    select: {
      id: true,
      nama: true,
      thumbnail: true,
    },
  });

  await prisma.gallery.createMany({
    data: cagarBudaya.map((item) => ({
      cagarId: item.id,
      image: item.thumbnail as string,
      caption: item.nama,
      urutan: 1,
    })),
  });

  console.log("✅ Seed berhasil");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
