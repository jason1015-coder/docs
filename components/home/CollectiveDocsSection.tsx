import Link from "next/link";

export function CollectiveDocsSection() {
  return (
    <section id="collective" className="pt-16 pb-32 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="border-t border-border/50 mb-16" />
        <div className="mb-8 sm:mb-16 border-b border-foreground/20 pb-4 sm:pb-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            The Collective
          </h2>
          <p className="text-xs sm:text-lg text-foreground/70 font-mono">
            Operational documentation for the Nano Collective — the shared
            conventions, playbooks, and values behind every project.
          </p>
        </div>
        <div className="bg-background border border-foreground/20 p-8 group hover:bg-muted transition-all hover:shadow-lg dark:hover:shadow-[0_4px_20px_rgb(0,0,0,0.5)] hover:-translate-y-1 flex flex-col h-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 dark:opacity-100 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="hidden sm:block font-mono text-xs sm:text-sm font-bold text-[#0000EE] dark:text-[#A1A1AA]">
                  [ core ]
                </span>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Nano Collective
                </h3>
              </div>
            </div>
            <p className="text-sm sm:text-lg text-foreground/70 leading-relaxed mb-8 flex-grow">
              How we work as a collective: repo and CI conventions, stack
              suggestions, community and contribution guidelines — everything
              that keeps projects consistent across the collective.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/collective"
                className="inline-flex h-12 items-center justify-center bg-[#0000EE] dark:bg-foreground px-8 text-sm font-semibold tracking-wide text-white dark:text-background transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground w-full sm:w-auto group/btn"
              >
                <span className="mr-3 font-bold text-white dark:text-background transition-colors">
                  &gt;
                </span>
                View Docs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
