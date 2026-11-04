import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { Role, Lane, Prisma } from "@prisma/client";

export const getAllHeroes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string) || undefined;
    const roleQuery = (req.query.role as string) || undefined;

    const where: Prisma.HeroWhereInput = {};

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (roleQuery) {
      if (!Object.values(Role).includes(roleQuery as Role)) {
        throw new HttpError(400, "Role hero tidak valid");
      }
      where.role = roleQuery as Role;
    }

    const [totalItems, heroes] = await Promise.all([
      prisma.hero.count({ where }),
      prisma.hero.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: "asc" },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      status: true,
      message: "Berhasil mengambil data hero",
      data: heroes,
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

export const getHeroDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const heroId = Number(req.params.hero_id);
    if (isNaN(heroId)) {
      throw new HttpError(404, "Hero tidak ditemukan");
    }

    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      include: { skins: true },
    });

    if (!hero) {
      throw new HttpError(404, "Hero tidak ditemukan");
    }

    res.status(200).json({
      status: true,
      message: "Berhasil mengambil detail hero",
      data: hero,
    });
  } catch (error) {
    next(error);
  }
};

export const createHero = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, role, lane, releaseYear, priceBP, priceDiamond } = req.body;

    // 1. name, role, lane, atau releaseYear tidak diisi -> 400
    if (
      !name ||
      typeof name !== "string" ||
      !name.trim() ||
      !role ||
      !Object.values(Role).includes(role as Role) ||
      !lane ||
      !Object.values(Lane).includes(lane as Lane) ||
      releaseYear === undefined ||
      releaseYear === null ||
      isNaN(Number(releaseYear))
    ) {
      throw new HttpError(
        400,
        "Data name, role, lane, dan releaseYear wajib diisi dengan benar"
      );
    }

    // 2. Nama hero sudah ada -> 409
    const existingHero = await prisma.hero.findUnique({
      where: { name: name.trim() },
    });
    if (existingHero) {
      throw new HttpError(409, `Hero dengan nama ${name} sudah ada`);
    }

    // 3. Berhasil -> 201 berisi hero baru
    const newHero = await prisma.hero.create({
      data: {
        name: name.trim(),
        role: role as Role,
        lane: lane as Lane,
        releaseYear: Number(releaseYear),
        priceBP:
          priceBP !== undefined && priceBP !== null ? Number(priceBP) : null,
        priceDiamond:
          priceDiamond !== undefined && priceDiamond !== null
            ? Number(priceDiamond)
            : null,
      },
    });

    res.status(201).json({
      status: true,
      message: "Hero berhasil ditambahkan",
      data: newHero,
    });
  } catch (error) {
    next(error);
  }
};

