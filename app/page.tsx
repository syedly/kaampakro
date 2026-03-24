import Link from "next/link"
import {
  Wand2,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Wand2,
    title: "AI-Powered Generation",
    description: "GPT-4o crafts highly persuasive, tailored letters in under 10 seconds.",
  },
  {
    icon: FileText,
    title: "Multiple Templates",
    description: "Modern, Executive, Technical, Creative — or build your own custom template.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Paste a job description, click generate. Your letter is ready immediately.",
  },
  {
    icon: Shield,
    title: "Your Data, Your Key",
    description: "Use your own OpenAI API key for unlimited generations with full privacy.",
  },
  {
    icon: Clock,
    title: "Save & Manage Drafts",
    description: "Store all your cover letters, edit drafts, and download anytime.",
  },
  {
    icon: Sparkles,
    title: "Custom Prompts",
    description: "Define exactly how the AI writes — your voice, your style, every time.",
  },
]

const steps = [
  { step: "01", title: "Create your profile", desc: "Add your skills and experience once." },
  { step: "02", title: "Paste the job description", desc: "Drop in any job posting." },
  { step: "03", title: "Generate & download", desc: "Get your letter in seconds." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Wand2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">KaamPakro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md shadow-primary/20"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="relative max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            Powered by GPT-4o
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Cover letters that
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              actually get interviews
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Stop spending hours writing cover letters. KaamPakro generates personalized,
            high-conversion letters tailored to any job in seconds — not hours.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-14 gap-2 bg-gradient-to-r from-primary to-accent px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
              >
                Start for Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base">
                Log in to your account
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            5 free letters per month · No credit card required
          </p>
        </div>

        {/* Mock preview card */}
        <div className="relative mt-20 w-full max-w-3xl">
          <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="h-6 flex-1 rounded-md bg-muted" />
            </div>
            <div className="space-y-2.5">
              <div className="h-4 w-full rounded bg-muted/60" />
              <div className="h-4 w-5/6 rounded bg-muted/60" />
              <div className="h-4 w-4/5 rounded bg-muted/60" />
              <div className="h-4 w-full rounded bg-muted/40" />
              <div className="h-4 w-3/4 rounded bg-muted/40" />
              <div className="pt-2" />
              <div className="h-4 w-full rounded bg-muted/60" />
              <div className="h-4 w-5/6 rounded bg-muted/60" />
              <div className="h-4 w-2/3 rounded bg-muted/60" />
            </div>
            <div className="mt-4 flex justify-end">
              <div className="h-8 w-32 rounded-md bg-gradient-to-r from-primary/40 to-accent/40" />
            </div>
          </div>
          <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 blur-xl" />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">Three steps to your perfect cover letter</p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-2xl font-black text-primary">
                {s.step}
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Everything you need</h2>
            <p className="mt-3 text-muted-foreground">
              Built for job seekers who want results, not just words
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to land your next interview?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of job seekers who use KaamPakro to write better cover letters, faster.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-14 gap-2 bg-gradient-to-r from-primary to-accent px-10 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            {["5 free letters/month", "No credit card", "Cancel anytime"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-accent">
            <Wand2 className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">KaamPakro</span>
        </div>
        <p className="mt-2">© 2024 KaamPakro. All rights reserved.</p>
      </footer>
    </div>
  )
}
