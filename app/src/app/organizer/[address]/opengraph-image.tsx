import { ImageResponse } from "next/og";
import { PublicKey } from "@solana/web3.js";
import { fetchMintDecimals, fetchOrganizerOrders, organizerStats } from "@/lib/pacto/reads";
import { formatUnits, shortAddress } from "@/lib/pacto/format";

export const alt = "Pacto organizer reputation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  let completed = 0;
  let disputesLost = 0;
  let volume = "0";
  try {
    new PublicKey(address);
    const orders = await fetchOrganizerOrders(address);
    const stats = organizerStats(orders);
    const decimals = orders.length ? await fetchMintDecimals(orders[0].mint) : 6;
    completed = stats.completed;
    disputesLost = stats.disputesLost;
    volume = formatUnits(stats.volumeSettled, decimals, 0);
  } catch {
    // Render the card with zeros rather than failing the share preview.
  }

  const headline =
    completed === 0 ? "New organizer" : disputesLost === 0 ? "Clean record" : "Track record";
  const cells = [
    { label: "Completed orders", value: String(completed) },
    { label: "USDC settled", value: volume },
    { label: "Disputes lost", value: String(disputesLost) },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: 72,
          color: "#15171a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="24" cy="32" r="17" fill="none" stroke="#0e7c72" strokeWidth="6" />
            <circle cx="40" cy="32" r="17" fill="none" stroke="#15171a" strokeWidth="6" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 600 }}>Pacto</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 28, color: "#0e7c72" }}>Organizer reputation, verified on Solana</div>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>{headline}</div>
          <div style={{ fontSize: 32, color: "#5b6168", fontFamily: "monospace" }}>{shortAddress(address, 8)}</div>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {cells.map((c) => (
            <div
              key={c.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 28,
                borderRadius: 20,
                background: "#e2f2ef",
              }}
            >
              <div style={{ fontSize: 56, fontWeight: 700, color: "#0a5a51" }}>{c.value}</div>
              <div style={{ fontSize: 24, color: "#0a5a51" }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
