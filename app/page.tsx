import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import {
  Kanban,
  ArrowRight,
  Columns3,
  GripVertical,
  Palette,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full max-w-6xl flex justify-between items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
              <Kanban className="h-4 w-4 text-white" />
            </div>
            <span>TaskFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/5 blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-500/10 to-pink-500/5 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-sm text-muted-foreground mb-6">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Powered by Supabase
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Organize your work with
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {" "}
              TaskFlow
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A beautiful, drag-and-drop kanban board to help you manage tasks,
            track progress, and stay organized. Built with Next.js and Supabase.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" asChild className="gap-2">
              <Link href="/auth/sign-up">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <FeatureCard
              icon={<Columns3 className="h-5 w-5" />}
              title="Configurable Columns"
              description="Create and customize columns to match your workflow"
            />
            <FeatureCard
              icon={<GripVertical className="h-5 w-5" />}
              title="Drag & Drop"
              description="Effortlessly move tasks between columns with smooth animations"
            />
            <FeatureCard
              icon={<Palette className="h-5 w-5" />}
              title="Color Coded"
              description="Assign colors to columns for quick visual organization"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Built with{" "}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              Next.js
            </a>{" "}
            and{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              Supabase
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl border bg-card/50 backdrop-blur-sm text-left transition-all hover:shadow-md hover:border-primary/20">
      <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mb-3">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
