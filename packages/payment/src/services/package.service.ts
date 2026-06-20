import { prisma } from "@acs/database";
import { Decimal } from "@prisma/client/runtime/library";

export interface PointPackageDto {
  id: string;
  name: string;
  points: number;
  price: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export class PackageService {
  async listEnabled(): Promise<PointPackageDto[]> {
    const rows = await prisma.pointPackage.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
    return rows.map(mapPackage);
  }

  async listAll(): Promise<PointPackageDto[]> {
    const rows = await prisma.pointPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
    return rows.map(mapPackage);
  }

  async getById(id: string): Promise<PointPackageDto | null> {
    const row = await prisma.pointPackage.findUnique({ where: { id } });
    return row ? mapPackage(row) : null;
  }

  async create(input: {
    name: string;
    points: number;
    price: number;
    enabled?: boolean;
    sortOrder?: number;
  }): Promise<PointPackageDto> {
    const row = await prisma.pointPackage.create({
      data: {
        name: input.name,
        points: input.points,
        price: new Decimal(input.price),
        enabled: input.enabled ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return mapPackage(row);
  }

  async update(
    id: string,
    input: Partial<{ name: string; points: number; price: number; enabled: boolean; sortOrder: number }>
  ): Promise<PointPackageDto> {
    const row = await prisma.pointPackage.update({
      where: { id },
      data: {
        name: input.name,
        points: input.points,
        price: input.price != null ? new Decimal(input.price) : undefined,
        enabled: input.enabled,
        sortOrder: input.sortOrder,
      },
    });
    return mapPackage(row);
  }
}

function mapPackage(row: {
  id: string;
  name: string;
  points: number;
  price: Decimal;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): PointPackageDto {
  return {
    id: row.id,
    name: row.name,
    points: row.points,
    price: Number(row.price),
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const packageService = new PackageService();
