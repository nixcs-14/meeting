import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Tester la connexion à la base
    const userCount = await prisma.user.count();
    const reservationCount = await prisma.reservation.count();
    
    return NextResponse.json({
      status: "OK",
      database: "Turso",
      users: userCount,
      reservations: reservationCount,
      message: "Connexion à la base de données réussie"
    });
  } catch (error) {
    console.error("Erreur de base de données:", error);
    return NextResponse.json({
      status: "ERROR",
      error: String(error),
      message: "Échec de connexion à la base de données"
    }, { status: 500 });
  }
}