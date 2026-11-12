import React, { useState } from 'react';
import {
  Coffee,
  Clock,
  Command,
  ExternalLink,
  Github,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { Button } from './ui';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  recentCount: number;
  onOpenHistory: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  recentCount,
  onOpenHistory,
  onOpenShortcuts,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Brand Area */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#workbench"
            className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xl"
          >
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-foreground leading-tight">
                PerspectiveFix
              </span>
              <span className="text-[11px] text-muted font-normal leading-tight">
                Document &amp; Photo Lens
              </span>
            </div>
          </a>
        </div>

        {/* Center Navigation Links: Google Clean */}
        <nav
          aria-label="Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-muted"
        >
          <a
            href="#workbench"
            className="hover:text-foreground transition-colors"
          >
            Editor
          </a>
          <a
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#faq"
            className="hover:text-foreground transition-colors"
          >
            FAQ
          </a>
          <a
            href="https://perspectivefix.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors text-xs"
          >
            <span>Full Suite</span>
            <ExternalLink className="w-3 h-3 text-muted" aria-hidden="true" />
          </a>
        </nav>

        {/* Right Tools Area */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <a
            href="https://www.buymeacoffee.com/oathanrex"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Coffee className="h-4 w-4" aria-hidden="true" />
            <span>Support</span>
          </a>

          {/* Recent Scans Drawer Trigger */}
          <Button
            tone="quiet"
            onClick={onOpenHistory}
            aria-label={`Open recent scans history (${recentCount} items)`}
            title="View recent scans in this browser"
            className="min-h-9 px-2.5 sm:px-3 text-xs rounded-full"
          >
            <Clock className="w-4 h-4 text-muted" aria-hidden="true" />
            <span className="hidden sm:inline font-medium">Recent</span>
            {recentCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-mono text-[11px] font-semibold">
                {recentCount}
              </span>
            )}
          </Button>

          {/* Keyboard Shortcuts Trigger */}
          <Button
            tone="quiet"
            onClick={onOpenShortcuts}
            aria-label="View keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            className="min-h-9 w-9 px-0 rounded-full text-muted hover:text-foreground hidden sm:inline-flex"
          >
            <Command className="w-4 h-4" aria-hidden="true" />
          </Button>

          {/* Theme Switcher */}
          <Button
            tone="quiet"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title="Toggle theme (T)"
            className="min-h-9 w-9 px-0 rounded-full"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-foreground" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-foreground" aria-hidden="true" />
            )}
          </Button>

          {/* GitHub link */}
          <a
            href="https://github.com/oathanrex"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            title="View author on GitHub"
            className="hidden sm:inline-flex min-h-9 w-9 items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-well transition-colors"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
          </a>

          {/* Mobile hamburger */}
          <Button
            tone="quiet"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden min-h-9 w-9 px-0 rounded-full"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Menu className="w-4 h-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-1 text-sm font-medium"
        >
          <a
            href="#workbench"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-10 flex items-center px-3 rounded-lg text-foreground hover:bg-well"
          >
            Editor
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenHistory();
            }}
            className="min-h-10 flex items-center justify-between px-3 rounded-lg text-left text-foreground hover:bg-well"
          >
            <span>Recent Scans</span>
            {recentCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-semibold">
                {recentCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenShortcuts();
            }}
            className="min-h-10 flex items-center px-3 rounded-lg text-left text-foreground hover:bg-well"
          >
            Keyboard Shortcuts (?)
          </button>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-10 flex items-center px-3 rounded-lg text-foreground hover:bg-well"
          >
            Features &amp; Security
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-10 flex items-center px-3 rounded-lg text-foreground hover:bg-well"
          >
            FAQ
          </a>
          <a
            href="https://perspectivefix.app"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-10 flex items-center justify-between px-3 rounded-lg text-foreground hover:bg-well"
          >
            <span>Full Tool Suite</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
          </a>
        </nav>
      )}
    </header>
  );
};
