"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PUBLIC_RPC_URL } from "@/lib/solana/cluster";
import "@solana/wallet-adapter-react-ui/styles.css";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false, retry: 1 } },
      }),
  );
  // Wallet Standard wallets (Phantom, Solflare, Backpack, ...) register themselves.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={PUBLIC_RPC_URL} config={{ commitment: "confirmed" }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--surface)",
                  color: "var(--ink)",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-md)",
                  fontFamily: "var(--font-sans)",
                },
              }}
            />
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
