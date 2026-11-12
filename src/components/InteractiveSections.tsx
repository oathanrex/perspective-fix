import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Lock,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { SAMPLE_SPECIMENS, type SampleSpecimenKey } from '../utils/samples';
import { Button } from './ui';

interface InteractiveSectionsProps {
  onSelectSpecimen: (key: SampleSpecimenKey) => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'privacy',
    question: 'Are my photos and scanned documents kept private?',
    answer:
      'Yes, 100%. All edge detection, projective homography mathematics, and illumination whitening execute entirely inside your device browser memory via Web Workers. No file is ever transmitted to an external server.',
  },
  {
    id: 'homography',
    question: 'How is this different from standard cropping or rotation?',
    answer:
      'Standard crop and rotate tools only turn an image around a 2D axis. Perspective solves a full 3×3 projective homography matrix across all 4 corner coordinates, straightening non-parallel keystone distortion and restoring true rectangular proportions.',
  },
  {
    id: 'filters',
    question: 'Which enhancement filter should I choose?',
    answer:
      'Choose "Document" to whiten shadow-cast paper while preserving colored stamps and signatures. Choose "B&W Ink" for maximum text clarity on receipts and books. Use "Whiteboard" to eliminate glare while keeping marker pigments bright, or "Photo" to retain original natural colors.',
  },
];

export const InteractiveSections: React.FC<InteractiveSectionsProps> = ({
  onSelectSpecimen,
}) => {
  const [openFaqId, setOpenFaqId] = useState<string>('privacy');

  return (
    <div className="mt-14 space-y-16 max-w-7xl mx-auto pb-12">
      {/* 3 Pillars of Google-Clean Tech & Security */}
      <section id="features" aria-labelledby="features-heading" className="pt-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2
            id="features-heading"
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground"
          >
            Built for precision, engineered for privacy
          </h2>
          <p className="mt-2 text-sm text-muted">
            The power of dedicated document scanning hardware directly in your web browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border/70 bg-surface shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Sub-Pixel Homography
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Corrects trapezoidal keystone distortion with an 8-degree-of-freedom projective warp, restoring true parallel lines and razor-sharp text proportions.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/70 bg-surface shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Adaptive Illumination
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Balances uneven desk shadows and dingy room lighting while keeping signatures, highlighter marks, and pen strokes vivid and punchy.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/70 bg-surface shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Zero Cloud Uploads
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              All processing happens 100% locally on your machine via Web Workers. Contracts, receipts, and sensitive files never leave your device.
            </p>
          </div>
        </div>
      </section>

      {/* Clean Demo Showcase Carousel Strip */}
      <section aria-labelledby="examples-heading" className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 id="examples-heading" className="text-lg font-semibold tracking-tight text-foreground">
            Explore live specimens
          </h2>
          <span className="text-xs text-muted">Click any scenario to load into editor</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SAMPLE_SPECIMENS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectSpecimen(item.key)}
              className="p-3.5 rounded-xl border border-border/70 bg-surface hover:bg-well hover:border-primary/50 text-left transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <span className="text-xs font-semibold text-foreground block group-hover:text-primary transition-colors">
                  {item.label}
                </span>
                <span className="text-[11px] text-muted line-clamp-1 mt-0.5">
                  {item.recommendedFilter} preset
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-primary font-medium">
                <span>Load</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Clean FAQ Accordion */}
      <section id="faq" aria-labelledby="faq-heading" className="max-w-3xl mx-auto pt-4">
        <div className="text-center mb-6">
          <h2 id="faq-heading" className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Frequently asked questions
          </h2>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface divide-y divide-border/60 overflow-hidden shadow-xs">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openFaqId === item.id;
            const panelId = `faq-panel-${item.id}`;
            const btnId = `faq-btn-${item.id}`;
            return (
              <div key={item.id}>
                <h3>
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-well/50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    className="px-5 pb-4 text-xs sm:text-sm text-muted leading-relaxed"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Google-Clean Footer */}
      <footer className="border-t border-border/70 pt-8 text-xs text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="font-semibold text-foreground">Perspective</span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span>
            Created by{' '}
            <a
              href="https://oathanrex.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors font-medium underline-offset-2 hover:underline"
            >
              Oathan Rex
            </a>
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <a
            href="https://perspectivefix.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
          >
            <span>perspectivefix.app</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/oathanrex"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://youtube.com/@oathanrex"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            YouTube
          </a>
          <a
            href="https://www.buymeacoffee.com/oathanrex"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Support Project
          </a>
        </div>
      </footer>
    </div>
  );
};
