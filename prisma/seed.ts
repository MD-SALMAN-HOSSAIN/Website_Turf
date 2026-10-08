import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const pitches = [
  {
    slug: "fifa-7",
    name: "FIFA 7-a-side",
    sport: "Football",
    dimensions: "60m × 40m",
    ratePerHour: 1200,
    imageUrl: "/images/pitches/fifa-7.jpg",
    description:
      "FIFA-standard artificial turf with floodlights, ideal for competitive 7-a-side matches.",
    order: 1,
  },
  {
    slug: "futsal",
    name: "Futsal Court",
    sport: "Futsal",
    dimensions: "40m × 20m",
    ratePerHour: 900,
    imageUrl: "/images/pitches/futsal.jpg",
    description:
      "Indoor-style hard court with rebound boards for fast five-a-side futsal games.",
    order: 2,
  },
  {
    slug: "box-cricket",
    name: "Box Cricket",
    sport: "Cricket",
    dimensions: "30m × 15m",
    ratePerHour: 1000,
    imageUrl: "/images/pitches/box-cricket.jpg",
    description:
      "Enclosed netted arena for box cricket sessions, corporate events, and practice drills.",
    order: 3,
  },
];

async function main() {
  for (const pitch of pitches) {
    await prisma.pitch.upsert({
      where: { slug: pitch.slug },
      update: pitch,
      create: pitch,
    });
  }

  await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteName: "TurfHub",
      tagline: "Book your pitch. Play your game.",
      noticeText:
        "Night slots are now open till 11 PM — weekend slots sell out fast, book early!",
      noticeEnabled: true,
      address: "House 12, Road 5, Dhanmondi, Dhaka 1205",
      phone: "+880 1700-000000",
      emergencyPhone: "+880 1700-111111",
      email: "hello@turfhub.com",
      openingTime: "06:00",
      closingTime: "23:00",
      mapsUrl: "https://maps.google.com",
      facebookUrl: "https://facebook.com",
    },
  });

  const email = process.env.ADMIN_EMAIL ?? "admin@turfhub.local";
  const password = process.env.ADMIN_PASSWORD ?? "turfhub123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Super Admin",
      role: "ADMIN",
    },
  });

  console.log("Seeded pitches, site config, and admin user.");
  console.log(`Admin login: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
