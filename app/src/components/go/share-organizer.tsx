"use client";

import { Copy, XLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { SITE_URL } from "@/lib/solana/cluster";
import { useT } from "@/lib/i18n/provider";

export function ShareOrganizer({ address, completed }: { address: string; completed: number }) {
  const t = useT();
  const pageUrl = `${SITE_URL}/organizer/${address}`;
  const text =
    completed === 0 ? t("orgShare.tweetNew") : completed === 1 ? t("orgShare.tweetDoneOne") : t("orgShare.tweetDone", { n: completed });
  const tweet = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          await navigator.clipboard.writeText(pageUrl);
          toast.success(t("share.linkCopied"));
        }}
      >
        <Copy size={16} /> {t("orgShare.copy")}
      </Button>
      <ButtonLink href={tweet} variant="ghost" size="sm" external>
        <XLogo size={16} /> {t("share.share")}
      </ButtonLink>
    </div>
  );
}
