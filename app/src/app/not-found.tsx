import { EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <EmptyState title="Page not found" body="That link does not go anywhere." action={<ButtonLink href="/">Go home</ButtonLink>} />
    </div>
  );
}
