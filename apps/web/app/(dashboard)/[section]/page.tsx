import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { findRoute } from "@/lib/access/navigation";
import { requirePagePermission } from "@/lib/access/require-page-permission";

/**
 * Placeholder for sidebar sections that have no screen yet. Replace by adding a
 * real `app/(dashboard)/<section>/page.tsx`; static routes win over this one.
 * Unknown segments 404, and so do sections the member has no permission for.
 */
export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const route = findRoute(section);
  if (!route) notFound();

  await requirePagePermission(route.permissions);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <h1 className="text-xl font-semibold">{route.title}</h1>
        <p className="text-sm text-muted-foreground">{route.description}</p>
      </div>
      <EmptyState
        variant="generic"
        title={`${route.title} is coming soon`}
        description="This screen has not been built yet."
      />
    </div>
  );
}
