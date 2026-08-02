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
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Crop disease diagnosis from a photo, with treatment steps and spray timing for your
            location.
          </p>
          <div className="flex items-center gap-3 pt-2">
            {socials.map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid size-9 place-items-center rounded-full border border-border bg-background/40 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">Explore</h4>
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
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="mailto:hello@ugagroscan.com" className="inline-flex items-center gap-2 transition-colors hover:text-primary">
                <Mail className="size-3.5" /> hello@ugagroscan.com
              </a>
            </li>
            <li className="inline-flex items-center gap-2">
              <MapPin className="size-3.5" /> Accra, Ghana
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} UG AgroScan</span>
          <span>Accra, Ghana</span>
        </div>
      </div>
    </footer>
  );
}