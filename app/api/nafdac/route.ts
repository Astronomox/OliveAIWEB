// app/api/nafdac/route.ts — NAFDAC registration lookup
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const number = searchParams.get("number");

    // This would ideally hit a live NAFDAC scraper/database
    // For now, we rely on the client-side mock db logic
    return NextResponse.json({ message: "Lookup ready" });
}
