import { NextResponse } from "next/server";
import { fetchConfig } from "@/lib/pacto/reads";

export async function GET() {
  const config = await fetchConfig();
  return NextResponse.json({ config });
}
