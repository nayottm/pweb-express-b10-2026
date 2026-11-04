import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { Rarity, Prisma } from "@prisma/client";

export const getAllSkins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const heroIdQuery = req.query.heroId as string | undefined;
    const rarityQuery = req.query.rarity as string | undefined;

    const where: Prisma.SkinWhereInput = {};

    if (heroIdQuery !== undefined) {
      const parsedHeroId = Number(heroIdQuery);
      if (isNaN(parsedHeroId)) {
        throw new HttpError(400, "heroId harus berupa angka");
      }
      where.heroId = parsedHeroId;
    }

    if (rarityQuery) {
      if (!Object.values(Rarity).includes(rarityQuery as Rarity)) {
        throw new HttpError(400, "Rarity skin tidak valid");
      }
      where.rarity = rarityQuery as Rarity;
    }

    const [totalItems, skins] = await Promise.all([
      prisma.skin.count({ where }),
      prisma.skin.findMany({
        where,
        include: {
          hero: {
            select: { name: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: "asc" },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      status: true,
      message: "Berhasil mengambil data skin",
      data: skins,
      metadata: {
        currentPage: page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSkinDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const skinId = Number(req.params.skin_id);
    if (isNaN(skinId)) {
      throw new HttpError(404, "Skin tidak ditemukan");
    }

    const skin = await prisma.skin.findUnique({
      where: { id: skinId },
      include: { hero: true },
    });

    if (!skin) {
      throw new HttpError(404, "Skin tidak ditemukan");
    }

    res.status(200).json({
      status: true,
      message: "Berhasil mengambil detail skin",
      data: skin,
    });
  } catch (error) {
    next(error);
  }
};

