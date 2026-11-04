import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma.js";
import { Role, Lane, Rarity, Currency } from "@prisma/client";

interface RawHero {
  name: string;
  primaryRole: Role;
  primaryLane: Lane;
  releaseYear: number;
  priceBP: number | null;
  priceDiamond: number | null;
}

interface RawSkin {
  name: string;
  heroId: number;
  rarity: Rarity;
  priceDiamond: number | null;
}

async function main() {
  console.log("Mengosongkan tabel dan me-reset urutan ID...");
  // 1. Kosongkan semua tabel dan kembalikan ID ke 1
  await prisma.$executeRawUnsafe(
    `TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE;`
  );

  // 2. Baca dan masukkan 133 Hero
  const heroesPath = path.join(process.cwd(), "data", "heroes.json");
  const rawHeroes: RawHero[] = JSON.parse(fs.readFileSync(heroesPath, "utf-8"));

  await prisma.hero.createMany({
    data: rawHeroes.map((h) => ({
      name: h.name,
      role: h.primaryRole,
      lane: h.primaryLane,
      releaseYear: Number(h.releaseYear),
      priceBP: h.priceBP !== null && h.priceBP !== undefined ? Number(h.priceBP) : null,
      priceDiamond:
        h.priceDiamond !== null && h.priceDiamond !== undefined
          ? Number(h.priceDiamond)
          : null,
    })),
  });
  console.log(`Berhasil menambahkan ${rawHeroes.length} hero.`);

  // 3. Baca dan masukkan 892 Skin
  const skinsPath = path.join(process.cwd(), "data", "skins.json");
  const rawSkins: RawSkin[] = JSON.parse(fs.readFileSync(skinsPath, "utf-8"));

  await prisma.skin.createMany({
    data: rawSkins.map((s) => ({
      name: s.name,
      heroId: Number(s.heroId),
      rarity: s.rarity,
      priceDiamond:
        s.priceDiamond !== null && s.priceDiamond !== undefined
          ? Number(s.priceDiamond)
          : null,
    })),
  });
  console.log(`Berhasil menambahkan ${rawSkins.length} skin.`);

  // 4. Masukkan 3 Player awal
  await prisma.player.createMany({
    data: [
      { nickname: "ArekITS", bp: 1500, diamond: 75 },
      { nickname: "SangPushRank", bp: 13000, diamond: 2892 },
      { nickname: "MageSurabaya", bp: 10000, diamond: 0 },
    ],
  });
  console.log("Berhasil menambahkan 3 player awal.");

  // Masukkan data PlayerHero awal
  await prisma.playerHero.createMany({
    data: [
      { playerId: 1, heroId: 18, currency: Currency.BP, pricePaid: 2000 },      // Layla
      { playerId: 1, heroId: 1, currency: Currency.BP, pricePaid: 10800 },      // Miya
      { playerId: 2, heroId: 84, currency: Currency.DIAMOND, pricePaid: 599 },  // Ling
      { playerId: 2, heroId: 56, currency: Currency.BP, pricePaid: 32000 },     // Gusion
    ],
  });
  console.log("Berhasil menambahkan 4 data PlayerHero awal.");
}

main()
  .catch((e) => {
    console.error("Gagal melakukan seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

