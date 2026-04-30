import { ButtonLink } from "@/components/ui/button-link";

export const metadata = {
  title: "Offline — AdCreator",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-label mb-3">No connection</p>
        <h1 className="text-h1 mb-4">
          You're <span className="text-serif text-primary">offline.</span>
        </h1>
        <p className="text-body text-muted-foreground mb-8">
          Reconnect and we'll pick up where you left off. Your last preview is
          cached locally if you came from the dashboard.
        </p>
        <ButtonLink href="/dashboard">Try again</ButtonLink>
      </div>
    </main>
  );
}
