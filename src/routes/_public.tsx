import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "sonner";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <MarketingNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}