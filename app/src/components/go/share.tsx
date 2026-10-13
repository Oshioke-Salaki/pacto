"use client";

import { Copy, Lightning, XLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { SITE_URL } from "@/lib/solana/cluster";
import { useT } from "@/lib/i18n/provider";

export function ShareRow({ address, title }: { address: string; title: string }) {
  const t = useT();
  const pageUrl = `${SITE_URL}/go/${address}`;
  const actionUrl = `${SITE_URL}/api/actions/go/${address}`;
  const blinkPreview = `https://dial.to/?action=solana-action:${encodeURIComponent(actionUrl)}`;
  const tweet = `https://x.com/intent/post?text=${encodeURIComponent(t("share.tweet", { title }))}&url=${encodeURIComponent(pageUrl)}`;

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => copy(pageUrl, t("share.linkCopied"))}>
        <Copy size={16} /> {t("share.copyLink")}
      </Button>
      <Button variant="secondary" size="sm" onClick={() => copy(actionUrl, t("share.blinkCopied"))}>
        <Lightning size={16} weight="fill" /> {t("share.copyBlink")}
      </Button>
      <ButtonLink href={blinkPreview} variant="ghost" size="sm" external>
        {t("share.previewBlink")}
      </ButtonLink>
      <ButtonLink href={tweet} variant="ghost" size="sm" external>
        <XLogo size={16} /> {t("share.share")}
      </ButtonLink>
    </div>
  );
}
