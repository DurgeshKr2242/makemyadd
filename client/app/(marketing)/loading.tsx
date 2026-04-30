import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <main className="flex-1">
      {/* Hero skeleton */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 gradient-aurora pointer-events-none"
        />
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-40 pb-24 lg:pb-32">
          <div className="grid lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-7 space-y-7">
              <Skeleton className="h-4 w-64" />
              <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-3/4" />
                <Skeleton className="h-14 w-1/2" />
              </div>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-12 w-44" />
                <Skeleton className="h-12 w-44" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <Skeleton className="aspect-square w-full max-w-md mx-auto rounded-3xl" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
