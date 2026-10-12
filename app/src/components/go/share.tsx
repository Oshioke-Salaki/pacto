"use client";

import { Copy, Lightning, XLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { SITE_URL } from "@/lib/solana/cluster";

export function ShareRow({ address, title }: { address: string; title: string }) {
  const pageUrl = `${SITE_URL}/go/${address}`;
  const actionUrl = `${SITE_URL}/api/actions/go/${address}`;
  const blinkPreview = `https://dial.to/?action=solana-action:${encodeURIComponent(actionUrl)}`;
  const tweet = `https://x.com/intent/post?text=${encodeURIComponent(`Join my group order "${title}" on Pacto. Money stays in escrow until it arrives.`)}&url=${encodeURIComponent(pageUrl)}`;

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => copy(pageUrl, "Link copied")}>
        <Copy size={16} /> Copy link
      </Button>
      <Button variant="secondary" size="sm" onClick={() => copy(actionUrl, "Blink URL copied")}>
        <Lightning size={16} weight="fill" /> Copy Blink
      </Button>
      <ButtonLink href={blinkPreview} variant="ghost" size="sm" external>
        Preview Blink
      </ButtonLink>
      <ButtonLink href={tweet} variant="ghost" size="sm" external>
        <XLogo size={16} /> Share
      </ButtonLink>
    </div>
  );
}
