import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export const getStatistics = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      totalPlayers,
      totalHeroesOwned,
      diamondAgg,
      mostOwnedGroup,
      heroesByRoleGroup,
    ] = await Promise.all([
      prisma.player.count(),
      prisma.playerHero.count(),
      prisma.player.aggregate({
        _sum: { diamond: true },
      }),
      prisma.playerHero.groupBy({
        by: ["heroId"],
        _count: { heroId: true },
        orderBy: [
          { _count: { heroId: "desc" } },
          { heroId: "asc" },
        ],
        take: 1,
      }),
      prisma.hero.groupBy({
        by: ["role"],
        _count: { role: true },
        orderBy: {
          _count: { role: "desc" },
        },
      }),
    ]);

    let mostOwnedHero = null;
    if (mostOwnedGroup.length > 0) {
      const topHeroId = mostOwnedGroup[0].heroId;
      const ownersCount = mostOwnedGroup[0]._count.heroId;
      const heroInfo = await prisma.hero.findUnique({
        where: { id: topHeroId },
        select: { id: true, name: true },
      });

      if (heroInfo) {
        mostOwnedHero = {
          heroId: heroInfo.id,
          name: heroInfo.name,
          owners: ownersCount,
        };
      }
    }

    const heroesPerRole = heroesByRoleGroup.map((item) => ({
      role: item.role,
      total: item._count.role,
    }));

    res.status(200).json({
      status: true,
      message: "Berhasil mengambil statistik",
      data: {
        totalPlayers,
        totalHeroesOwned,
        totalDiamond: diamondAgg._sum.diamond ?? 0,
        mostOwnedHero,
        heroesPerRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

