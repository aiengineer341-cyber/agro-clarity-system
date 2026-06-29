import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import { Mail, Github, Twitter, Linkedin, Instagram, MapPin } from "lucide-react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/research", label: "Research" },
  { to: "/contact", label: "Contact" },
];

const socials = [
  { href: "https://twitter.com/ugagroscan", Icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com/company/ugagroscan", Icon: Linkedin, label: "LinkedIn" },
  { href: "https://github.com/ugagroscan", Icon: Github, label: "GitHub" },
  { href: "https://instagram.com/ugagroscan", Icon: Instagram, label: "Instagram" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40 mt-32">
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            AI-powered plant disease detection and agronomy intelligence — built so every farmer can diagnose, decide, and act in seconds.
          </p>
          <div className="flex items-center gap-3 pt-2">
            {socials.map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="size-9 grid place-items-center rounded-sm border border-border bg-background/40 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all hover:-translate-y-0.5"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[11px] font-mono uppercase tracking-[0.18em] text-foreground">Explore</h4>
          <ul className="space-y-2">
            {nav.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-[11px] font-mono uppercase tracking-[0.18em] text-foreground">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="mailto:hello@ugagroscan.ai" className="inline-flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="size-3.5" /> hello@ugagroscan.ai
              </a>
            </li>
            <li className="inline-flex items-center gap-2">
              <MapPin className="size-3.5" /> Accra, Ghana
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row gap-3 justify-between items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <span>© {new Date().getFullYear()} UG AgroScan AI</span>
          <span>Protocol v1.0 · Built for the field</span>
        </div>
      </div>
    </footer>
  );
}