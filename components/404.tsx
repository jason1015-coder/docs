import Head from "next/head";
import Link from "next/link";
import { MainLayout } from "@/components/MainLayout";
import { PageTransition } from "@/components/ui/motion";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Not Found | Nano Collective</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MainLayout showSidebar={false}>
        <div className="flex-1 flex flex-col bg-background font-sans">
          <PageTransition className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 md:px-6 py-12 md:py-24 text-center min-h-[70vh]">
          <div className="space-y-8 max-w-4xl w-full">
            <div className="inline-block border-2 border-foreground/20 px-4 py-2 bg-muted/50 font-mono text-sm font-bold uppercase tracking-widest text-[#0000EE] dark:text-[#A1A1AA]">
              [ SYSTEM ERROR ]
            </div>
            
            <h1 className="text-[8rem] sm:text-[12rem] lg:text-[16rem] leading-none font-bold tracking-tighter text-foreground">
              404
            </h1>
            
            <p className="text-xl sm:text-3xl font-mono text-foreground/70 uppercase tracking-widest">
              The coordinates you requested do not exist in this sector.
            </p>

            <div className="pt-12">
              <Link 
                href="/"
                className="inline-flex items-center justify-center px-8 py-4 sm:px-12 sm:py-6 bg-foreground text-background font-mono font-bold uppercase tracking-widest text-sm sm:text-lg border-2 border-foreground hover:bg-[#0000EE] dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                &gt; RETURN_HOME
              </Link>
            </div>
            </div>
          </PageTransition>
        </div>
      </MainLayout>
    </>
  );
}
