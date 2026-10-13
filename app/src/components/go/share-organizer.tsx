"use client";

import { Copy, XLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { SITE_URL } from "@/lib/solana/cluster";

export function ShareOrganizer({ address, completed }: { address: string; completed: number }) {
  const pageUrl = `${SITE_URL}/organizer/${address}`;
  const text =
    completed > 0
      ? `${completed} group order${completed === 1 ? "" : "s"} delivered, verified on Solana with Pacto.`
      : "My organizer record on Pacto. Buyers' money stays in escrow until it arrives.";
  const tweet = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          await navigator.clipboard.writeText(pageUrl);
          toast.success("Link copied");
        }}
      >
        <Copy size={16} /> Copy reputation link
      </Button>
      <ButtonLink href={tweet} variant="ghost" size="sm" external>
        <XLogo size={16} /> Share
      </ButtonLink>
    </div>
  );
}
