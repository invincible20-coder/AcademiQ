"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Search, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function TopNav() {
  return (
    <header className="glass-strong border-b border-[var(--color-border)] px-6 py-3.5 flex items-center gap-4 shrink-0 z-10">
      {/* Mobile Hamburger Menu */}
      <Sheet>
        <SheetTrigger className="md:hidden p-2 -ml-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-all">
          <Menu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Access all dashboard features.</SheetDescription>
          <Sidebar className="w-full border-none h-full" />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full pl-9 pr-4 py-2 bg-[rgba(255,255,255,0.04)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:bg-[rgba(124,58,237,0.05)] transition-all duration-200"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-muted)] bg-[rgba(255,255,255,0.06)] border border-[var(--color-border)] px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-all">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-pink)] rounded-full border-2 border-[var(--color-bg-elevated)]" />
        </button>

        {/* Clerk user button */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 rounded-lg",
            },
          }}
        />
      </div>
    </header>
  );
}
