import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "sonner";
import { useTheme } from "@/lib/use-theme";
import { Home, Info, Users, BookOpen, Mail } from "lucide-react";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

const bottomItems = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/about", label: "About", Icon: Info },
  { to: "/team", label: "Team", Icon: Users },
  { to: "/research", label: "Research", Icon: BookOpen },
  { to: "/contact", label: "Contact", Icon: Mail },
];

function PublicLayout() {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <MarketingNav />
      <main className="flex-1 has-bottom-nav">
        <Outlet />
      </main>
      <SiteFooter />
      <BottomNav items={bottomItems} />
      <Toaster theme={theme} position="bottom-right" />
    </div>
  );
}