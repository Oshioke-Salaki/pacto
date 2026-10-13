import { NextResponse } from "next/server";
import { fetchBrlRate } from "@/lib/pacto/rate";

export async function GET() {
  return NextResponse.json(await fetchBrlRate());
}
