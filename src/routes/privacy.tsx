import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Mirror" },
      { name: "description", content: "How Mirror collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — Mirror" },
      { property: "og:description", content: "How Mirror collects, uses, and protects your data." },
    ],
  }),
  component: Privacy,
});

const SECTIONS: Array<{ heading: string; body: React.ReactNode }> = [
  {
    heading: "1. What Mirror is",
    body: (
      <p className="text-sm text-foreground/85 leading-relaxed">
        Mirror is a private AI perception engine. It analyzes behavioral signals — text conversations,
        voice patterns, social profiles, and personal descriptions — to show users how they are perceived by others.
        Mirror is not a therapy service, not a mental health tool, and not a social platform.
      </p>
    ),
  },
  {
    heading: "2. What we collect",
    body: (
      <>
        <p className="text-sm text-foreground/85 leading-relaxed">When you use Mirror we collect:</p>
        <ul className="space-y-1.5 mt-2">
          {[
            "Account information: email address and password (encrypted)",
            "Profile data: name, goals, and tone preferences you provide",
            "Scan inputs: text, descriptions, or media you submit for analysis",
            "Scan results: AI-generated reads, scores, and pattern data",
            "Usage data: scan history, streak data, and session frequency",
            "Device data: device type, operating system, and app version",
          ].map((item) => (
            <li key={item} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
              <span className="text-[#C9A84C]">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-foreground/85 leading-relaxed mt-3">
          We do not collect payment card information directly. Payments are processed by Stripe and subject to their privacy policy.
        </p>
      </>
    ),
  },
  {
    heading: "3. How we use your data",
    body: (
      <>
        <p className="text-sm text-foreground/85 leading-relaxed">We use your data to:</p>
        <ul className="space-y-1.5 mt-2">
          {[
            "Generate AI reads, patterns, scores, and behavioral insights",
            "Build your Mirror Memory — your longitudinal perception profile",
            "Improve your daily reads and predictions over time",
            "Operate and improve the Mirror service",
            "Send notifications about your reads and activity",
          ].map((item) => (
            <li key={item} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
              <span className="text-[#C9A84C]">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-foreground/85 leading-relaxed mt-3">
          We do not sell your data. We do not share your data with advertisers. Mirror products are ad-free.
        </p>
      </>
    ),
  },
  {
    heading: "4. AI processing",
    body: (
      <p className="text-sm text-foreground/85 leading-relaxed">
        Mirror uses third-party AI models to generate reads and insights. Your scan inputs are sent to these models for processing.
        We use OpenAI&apos;s API for text analysis. Inputs are processed according to OpenAI&apos;s privacy policy and data handling agreements.
        We do not use your data to train AI models.
      </p>
    ),
  },
  {
    heading: "5. Data storage and security",
    body: (
      <p className="text-sm text-foreground/85 leading-relaxed">
        Your data is stored securely using Supabase, a PostgreSQL database with row-level security.
        All data is encrypted at rest and in transit. Access to your data is restricted to your account only —
        no other Mirror user can see your reads, scores, or memory.
      </p>
    ),
  },
  {
    heading: "6. Data retention",
    body: (
      <p className="text-sm text-foreground/85 leading-relaxed">
        We retain your data for as long as your account is active. If you delete your account, all data associated with it —
        scans, scores, patterns, memory, reads, and profile information — is permanently deleted within 30 days.
        You can request deletion at any time by contacting us or using the delete account option in the app.
      </p>
    ),
  },
  {
    heading: "7. Your rights",
    body: (
      <>
        <p className="text-sm text-foreground/85 leading-relaxed">You have the right to:</p>
        <ul className="space-y-1.5 mt-2">
          {[
            "Access all data Mirror holds about you (use the Export feature in the app)",
            "Correct inaccurate profile information",
            "Delete your account and all associated data",
            "Withdraw consent for data processing",
            "Lodge a complaint with a data protection authority",
          ].map((item) => (
            <li key={item} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
              <span className="text-[#C9A84C]">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    heading: "8. Children",
    body: (
      <p className="text-sm text-foreground/85 leading-relaxed">
        Mirror is not intended for users under 17 years of age. We do not knowingly collect data from children.
        If you believe a child has created an account, contact us immediately.
      </p>
    ),
  },
  {
    heading: "9. Changes to this policy",
    body: (
      <p className="text-sm text-foreground/85 leading-relaxed">
        We may update this policy as Mirror evolves. We will notify users of significant changes through the app.
        Continued use of Mirror after changes constitutes acceptance of the updated policy.
      </p>
    ),
  },
];

function Privacy() {
  const email = "privacy@getmirror.app";
  const updated = "May 22, 2026";

  return (
    <main className="min-h-screen px-6 pt-10 pb-20 max-w-2xl mx-auto">
      <Link to="/" className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        ← Mirror
      </Link>

      <header className="mt-10">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Legal</p>
        <h1 className="font-display text-4xl text-gradient mt-2 leading-tight">Privacy Policy</h1>
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70 mt-3">
          Last updated: {updated}
        </p>
      </header>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="text-[11px] uppercase tracking-[0.28em] text-[#C9A84C]">{s.heading}</h2>
            {s.body}
          </section>
        ))}

        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-[0.28em] text-[#C9A84C]">10. Contact</h2>
          <p className="text-sm text-foreground/85 leading-relaxed">
            For privacy questions, data requests, or concerns:
          </p>
          <p className="text-sm text-foreground/90 font-mono">{email}</p>
        </section>
      </div>

      <footer className="mt-16 pt-8 border-t border-border/30 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/50">
          Mirror · Private by design · {updated}
        </p>
      </footer>
    </main>
  );
}
