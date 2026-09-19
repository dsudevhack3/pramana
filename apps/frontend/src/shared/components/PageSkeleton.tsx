/** Shown while a portal or page chunk loads. Same skeleton the portals use for their own loading states. */
export function PageSkeleton() {
  return (
    <div className="min-h-dvh px-4 py-6" role="status" aria-label="Loading">
      <div className="mx-auto flex max-w-content flex-col gap-4">
        <div className="skeleton h-9 w-56 rounded-control" />
        <div className="skeleton h-72 w-full rounded-card" />
      </div>
    </div>
  );
}
