import { EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <EmptyState
        title="Order not found"
        body="This address is not a Pacto group order on the current network, or it has not been confirmed yet."
        action={<ButtonLink href="/explore" variant="secondary">Back to explore</ButtonLink>}
      />
    </div>
  );
}
