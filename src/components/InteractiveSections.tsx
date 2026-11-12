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
    id: 'free',
    question: 'Is PerspectiveFix free to use?',
    answer:
      'Yes. You can use the perspective correction tools and export your results for free, with no watermark.',
  },
  {
    id: 'mobile',
    question: 'Can I use PerspectiveFix on my phone?',
    answer:
      'Yes. PerspectiveFix works in modern mobile browsers, and its corner controls support touch input.',
  },
  {
    id: 'formats',
    question: 'Which image formats can I use?',
    answer:
      'You can open common browser-supported image formats, including JPG, PNG, and WebP, or paste an image from your clipboard. Corrected images can be exported as PNG, JPG, or WebP.',
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
  {
    id: 'limits',
    question: 'Is there a limit to how many images I can correct?',
    answer:
      'There is no per-image or account quota. Images are processed in your browser, so very large files may be limited by the memory available on your device.',
  },
];

const HOW_IT_WORKS = [
  {
    title: 'Choose an image',
    description: 'Upload, drop, paste, or load one of the sample images.',
  },
  {
    title: 'Set the corners',
    description: 'Drag the four handles to the page edges, or try Auto-Snap.',
  },
  {
    title: 'Tune the result',
    description: 'Preview the correction and choose an enhancement or aspect ratio.',
  },
  {
    title: 'Save or copy',
    description: 'Export a PNG, JPG, or WebP image, or copy it to your clipboard.',
  },
] as const;

const USE_CASES = [
  'Receipts, forms, and document scans',
  'Book pages and study notes',
  'Whiteboards and presentation slides',
  'Building and interior photos',
  'Posters, signs, and product packaging',
  'Screenshots and screen captures',
] as const;

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

      <section aria-labelledby="how-it-works-heading" className="pt-2">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2
            id="how-it-works-heading"
            className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground"
          >
            How it works
          </h2>
          <p className="mt-2 text-sm text-muted">
            Straighten a tilted photo in a few simple steps, right in your browser.
          </p>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((step, index) => (
            <li
              key={step.title}
              className="p-5 rounded-2xl border border-border/70 bg-surface"
            >
              <span className="text-xs font-semibold tracking-widest text-primary">
                STEP 0{index + 1}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="perspective-heading" className="max-w-3xl mx-auto">
        <h2
          id="perspective-heading"
          className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground"
        >
          More than a crop
        </h2>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          A photo taken from an angle can make a page look like a trapezoid, with
          text stretched toward one side. Cropping only removes the edges.
          PerspectiveFix maps the four selected corners into a rectangle to
          straighten the image while keeping the whole page in view.
        </p>
      </section>

      <section aria-labelledby="use-cases-heading">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <h2
            id="use-cases-heading"
            className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground"
          >
            Made for everyday photos and documents
          </h2>
          <p className="mt-2 text-sm text-muted">
            Fix perspective in the images you use for work, study, and daily life.
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {USE_CASES.map((useCase) => (
            <li
              key={useCase}
              className="p-4 rounded-xl border border-border/70 bg-surface text-sm text-foreground"
            >
              {useCase}
            </li>
          ))}
        </ul>
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
