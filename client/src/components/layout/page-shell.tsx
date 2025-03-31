import { ReactNode } from "react";
import { NavigationBar } from "@/components/layout/navigation-bar";

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}