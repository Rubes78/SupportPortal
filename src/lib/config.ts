import { cache } from "react";
import { prisma } from "./prisma";

export const getSiteConfig = cache(async () => {
  const config = await prisma.siteConfig.findUnique({ where: { id: "default" } });
  // Row is guaranteed by migration INSERT, but guard anyway
  if (!config) {
    return prisma.siteConfig.create({ data: { id: "default" } });
  }
  return config;
});
