import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, MapPin, Send, Loader2, Check, Github, Twitter, Linkedin, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "Contact — UG AgroScan AI" },
      { name: "description", content: "Get in touch with the UG AgroScan team. Send us a message, partnership idea, or research question." },
      { property: "og:title", content: "Contact UG AgroScan" },
      { property: "og:description", content: "We'd love to hear from you." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const socials = [
  { href: "https://twitter.com/ugagroscan", Icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com/company/ugagroscan", Icon: Linkedin, label: "LinkedIn" },
  { href: "https://github.com/ugagroscan", Icon: Github, label: "GitHub" },
  { href: "https://instagram.com/ugagroscan", Icon: Instagram, label: "Instagram" },
];

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[issue.path[0] as string] = issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send your message. Try again.");
      return;
    }
    setSent(true);
    setForm({ name: "", email: "", message: "" });
    toast.success("Message sent — we'll get back to you soon.");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12">
      <section className="animate-slide-up">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Get in touch</p>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Let's talk fields.</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Partnerships, research collaborations, or just curious about UG AgroScan? Send a note and we'll reply within a couple of working days.
        </p>

        <div className="mt-10 space-y-4">
          <a href="mailto:hello@ugagroscan.ai" className="flex items-center gap-3 group">
            <div className="size-10 rounded-sm bg-primary/10 grid place-items-center group-hover:bg-primary/20 transition-colors">
              <Mail className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Email</p>
              <p className="text-sm text-foreground group-hover:text-primary transition-colors">hello@ugagroscan.ai</p>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-sm bg-primary/10 grid place-items-center">
              <MapPin className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Based in</p>
              <p className="text-sm">Accra, Ghana</p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Follow</p>
          <div className="flex items-center gap-3">
            {socials.map(({ href, Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="size-10 grid place-items-center rounded-sm border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 hover:-translate-y-0.5 transition-all">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="animate-slide-up" style={{ animationDelay: "120ms" }}>
        <form onSubmit={onSubmit} className="rounded-md border border-border bg-card p-8 space-y-5">
          <div>
            <label htmlFor="name" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={100}
              className="mt-2 w-full rounded-sm border border-border bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Your full name"
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              maxLength={255}
              className="mt-2 w-full rounded-sm border border-border bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="message" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Message</label>
            <textarea
              id="message"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              maxLength={2000}
              rows={6}
              className="mt-2 w-full rounded-sm border border-border bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
              placeholder="Tell us what you're working on…"
            />
            {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting || sent}
            className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {sent ? (<><Check className="size-4" /> Sent</>) : submitting ? (<><Loader2 className="size-4 animate-spin" /> Sending…</>) : (<><Send className="size-4" /> Send message</>)}
          </button>
        </form>
      </section>
    </div>
  );
}