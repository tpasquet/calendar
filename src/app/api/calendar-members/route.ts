import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const members = await prisma.user.findMany({
    select: { id: true, email: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ members });
}
