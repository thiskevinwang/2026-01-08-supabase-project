import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { Kanban } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full max-w-[1600px] flex justify-between items-center px-4">
          <div className="flex gap-4 items-center">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
            >
              <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
                <Kanban className="h-4 w-4 text-white" />
              </div>
              <span className="hidden sm:inline">TaskFlow</span>
            </Link>
          </div>
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

      <div className="flex-1 w-full max-w-[1600px] mx-auto p-4">{children}</div>
    </main>
  );
}
