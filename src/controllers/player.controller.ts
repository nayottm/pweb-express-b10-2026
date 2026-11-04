import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { Currency } from "@prisma/client";

// Fitur 4: Create Player (POST /api/players)
export const createPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nickname } = req.body;

    if (!nickname || typeof nickname !== "string" || !nickname.trim()) {
      throw new HttpError(400, "Nickname wajib diisi");
    }

    const existing = await prisma.player.findUnique({
      where: { nickname: nickname.trim() },
    });
    if (existing) {
      throw new HttpError(409, "Nickname sudah dipakai");
    }

    const newPlayer = await prisma.player.create({
      data: { nickname: nickname.trim() },
    });

    res.status(201).json({
      status: true,
      message: "Player berhasil dibuat",
      data: newPlayer,
    });
  } catch (error) {
    next(error);
  }
};

// Fitur 4: Get Player Detail (GET /api/players/:player_id)
export const getPlayerDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = Number(req.params.player_id);
    if (isNaN(playerId)) {
      throw new HttpError(404, "Player tidak ditemukan");
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        heroes: {
          include: {
            hero: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!player) {
      throw new HttpError(404, "Player tidak ditemukan");
    }

    // Format daftar hero sesuai spesifikasi gambar Fitur 6 (GET /api/players/3)
    const formattedPlayer = {
      id: player.id,
      nickname: player.nickname,
      bp: player.bp,
      diamond: player.diamond,
      createdAt: player.createdAt,
      heroes: player.heroes.map((ph) => ({
        heroId: ph.heroId,
        name: ph.hero.name,
        currency: ph.currency,
        pricePaid: ph.pricePaid,
      })),
    };

    res.status(200).json({
      status: true,
      message: "Berhasil mengambil data player",
      data: formattedPlayer,
    });
  } catch (error) {
    next(error);
  }
};

// Fitur 4: Update Player (PATCH /api/players/:player_id)
export const updatePlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = Number(req.params.player_id);
    if (isNaN(playerId)) {
      throw new HttpError(404, "Player tidak ditemukan");
    }

    // 1. Player tidak ada -> 404
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, "Player tidak ditemukan");
    }

    // 2. Nickname kosong -> 400
    const { nickname } = req.body;
    if (!nickname || typeof nickname !== "string" || !nickname.trim()) {
      throw new HttpError(400, "Nickname wajib diisi");
    }

    // 3. Sudah dipakai player lain -> 409
    const existingNickname = await prisma.player.findUnique({
      where: { nickname: nickname.trim() },
    });
    if (existingNickname && existingNickname.id !== playerId) {
      throw new HttpError(409, "Nickname sudah dipakai player lain");
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: { nickname: nickname.trim() },
    });

    res.status(200).json({
      status: true,
      message: "Nickname player berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Fitur 4: Delete Player (DELETE /api/players/:player_id)
export const deletePlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = Number(req.params.player_id);
    if (isNaN(playerId)) {
      throw new HttpError(404, "Player tidak ditemukan");
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, "Player tidak ditemukan");
    }

    await prisma.player.delete({
      where: { id: playerId },
    });

    res.status(200).json({
      status: true,
      message: "Player berhasil dihapus",
      data: player,
    });
  } catch (error) {
    next(error);
  }
};

// Fitur 5: Top Up Diamond (POST /api/players/:player_id/topup)
export const topUpDiamond = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = Number(req.params.player_id);
    const { amount } = req.body;

    // 1. amount bukan bilangan bulat lebih dari 0 -> 400
    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      throw new HttpError(400, "Amount harus bilangan bulat lebih dari 0");
    }

    // 2. Player tidak ditemukan -> 404
    if (isNaN(playerId)) {
      throw new HttpError(404, "Player tidak ditemukan");
    }
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, "Player tidak ditemukan");
    }

    // 3. Tambah diamond player dengan increment
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        diamond: { increment: amount },
      },
    });

    res.status(200).json({
      status: true,
      message: "Top up berhasil",
      data: {
        playerId: updatedPlayer.id,
        amount,
        diamond: updatedPlayer.diamond,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Fitur 5: Match (POST /api/players/:player_id/matches)
export const playMatch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = Number(req.params.player_id);
    const { result } = req.body;

    // 1. result bukan WIN/LOSE -> 400
    if (result !== "WIN" && result !== "LOSE") {
      throw new HttpError(400, "Result harus WIN atau LOSE");
    }

    // 2. Player tidak ditemukan -> 404
    if (isNaN(playerId)) {
      throw new HttpError(404, "Player tidak ditemukan");
    }
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, "Player tidak ditemukan");
    }

    // 3. Tambah bp player (WIN 300, LOSE 100) dengan increment
    const bpEarned = result === "WIN" ? 300 : 100;
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        bp: { increment: bpEarned },
      },
    });

    res.status(200).json({
      status: true,
      message: "Hadiah match berhasil ditambahkan",
      data: {
        playerId: updatedPlayer.id,
        result,
        bpEarned,
        bp: updatedPlayer.bp,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Fitur 6: Beli Hero (POST /api/players/:player_id/heroes)
export const buyHero = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const playerId = Number(req.params.player_id);
    const { heroId, currency } = req.body;

    // 1. heroId kosong, atau currency bukan BP/DIAMOND -> 400
    if (
      heroId === undefined ||
      heroId === null ||
      isNaN(Number(heroId)) ||
      (currency !== Currency.BP && currency !== Currency.DIAMOND)
    ) {
      throw new HttpError(
        400,
        "heroId wajib diisi dan currency harus BP atau DIAMOND"
      );
    }

    // 2. Player tidak ditemukan -> 404
    if (isNaN(playerId)) {
      throw new HttpError(404, "Player tidak ditemukan");
    }
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, "Player tidak ditemukan");
    }

    // 3. Hero tidak ditemukan -> 404
    const parsedHeroId = Number(heroId);
    const hero = await prisma.hero.findUnique({
      where: { id: parsedHeroId },
    });
    if (!hero) {
      throw new HttpError(404, "Hero tidak ditemukan");
    }

    // 4. Harga hero untuk currency tersebut kosong (null) -> 400
    const price =
      currency === Currency.BP ? hero.priceBP : hero.priceDiamond;
    if (price === null || price === undefined) {
      throw new HttpError(
        400,
        `Hero ${hero.name} tidak bisa dibeli dengan ${currency}`
      );
    }

    // 5. Player sudah memiliki hero tersebut -> 409
    const alreadyOwned = await prisma.playerHero.findUnique({
      where: {
        playerId_heroId: {
          playerId,
          heroId: parsedHeroId,
        },
      },
    });
    if (alreadyOwned) {
      throw new HttpError(409, `Player sudah memiliki hero ${hero.name}`);
    }

    // 6. Saldo player kurang dari harga hero -> 400
    const currentBalance =
      currency === Currency.BP ? player.bp : player.diamond;
    if (currentBalance < price) {
      throw new HttpError(400, `Saldo ${currency} tidak mencukupi`);
    }

    // Simpan dengan transaction (array berisi 2 query: decrement saldo & buat PlayerHero)
    const [updatedPlayer] = await prisma.$transaction([
      prisma.player.update({
        where: { id: playerId },
        data:
          currency === Currency.BP
            ? { bp: { decrement: price } }
            : { diamond: { decrement: price } },
      }),
      prisma.playerHero.create({
        data: {
          playerId,
          heroId: parsedHeroId,
          currency: currency as Currency,
          pricePaid: price,
        },
      }),
    ]);

    res.status(201).json({
      status: true,
      message: "Hero berhasil dibeli",
      data: {
        hero: {
          id: hero.id,
          name: hero.name,
        },
        currency,
        pricePaid: price,
        balance: {
          bp: updatedPlayer.bp,
          diamond: updatedPlayer.diamond,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

