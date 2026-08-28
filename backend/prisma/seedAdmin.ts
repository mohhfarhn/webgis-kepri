import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Cek apakah user admin sudah ada
  const existing = await prisma.user.findUnique({ where: { email: "admin@webgis.id" } });
  if (existing) {
    console.log("⚠️  User admin sudah ada, skip...");
    return;
  }

  const password = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      name: "Administrator",
      email: "admin@webgis.id",
      password,
    },
  });

  console.log("✅ User admin berhasil dibuat");
  console.log("   Email: admin@webgis.id");
  console.log("   Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
