import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="mb-10 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[480px_1fr]">
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-4"
            >
              <div className="flex items-start gap-4">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div>
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="aspect-square w-full max-w-md mx-auto rounded-2xl" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
