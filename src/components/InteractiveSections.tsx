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
    id: 'free',
    question: 'Is this tool really free?',
    answer:
      'Yes, PerspectiveFix is a 100% free online perspective correction tool. There are no hidden fees, no subscriptions, and we don\'t add watermarks to your work.',
  },
  {
    id: 'privacy',
    question: 'Do I need to upload my private photos to a server?',
    answer:
      'No. Unlike other "online" tools, our processing happens locally on your device. Your photos are never sent to a server, making it the safest way to fix sensitive documents like contracts, IDs, or personal notes.',
  },
  {
    id: 'mobile',
    question: 'Can I use this on my phone?',
    answer:
      'Absolutely. It\'s designed to be lightweight and works directly in any modern mobile browser. The touch-friendly corner handles make it easy to fix your "scanned" photos on the go.',
  },
  {
    id: 'formats',
    question: 'Which image formats can I use?',
    answer:
      'You can use JPG, PNG, WebP, and most common image formats. You can also paste an image directly from your clipboard by pressing Ctrl+V (or Cmd+V on Mac).',
  },
  {
    id: 'homography',
    question: 'How does the perspective correction actually work?',
    answer:
      'When you drag the four corners, the tool calculates a 3D perspective transformation. It then "pulls" those corners to form a perfect rectangle, straightening your image mathematically. Think of it like stretching a rubber photo until it looks perfectly flat and centered.',
  },
  {
    id: 'crop',
    question: 'Why is PerspectiveFix better than just cropping?',
    answer:
      'Cropping only cuts out a piece of the image, but it doesn\'t fix the tilt or "keystone" effect. PerspectiveFix actually warps the pixels to correct the angle, ensuring that text is aligned and proportions are preserved.',
  },
  {
    id: 'limits',
    question: 'Is there a limit to how many photos I can fix?',
    answer:
      'No, there are no limits. You can use PerspectiveFix as many times as you need. Since the processing happens on your own computer, we don\'t have to worry about server costs, and we\'re happy to keep it free for everyone.',
  },
];

const HOW_IT_WORKS = [
  {
    title: 'Upload',
    description: 'Drop or pick your tilted photo',
  },
  {
    title: 'Drag Corners',
    description: 'Move the 4 handles to mark what should be straight',
  },
  {
    title: 'Fix Instantly',
    description: 'Watch as your image is automatically straightened',
  },
  {
    title: 'Download',
    description: 'Get your corrected image at full quality',
  },
] as const;

const EVERYDAY_NEEDS = [
  '✅ Professional Document Scans: Turn crooked photos of receipts or contracts into perfectly flat, readable documents.',
  '✅ Save Your Study Notes: Straighten whiteboard lectures and book pages so you can focus on learning, not squinting.',
  '✅ Architecture & Real Estate: Easily fix tilted horizontal or vertical lines in photos of buildings and room interiors.',
  '✅ Clean Product Photography: Make your packaging and box photos look flat and professional for your online store.',
] as const;

const WORKS_WITH = [
  'Document Scans',
  'Real Estate',
  'Book Pages',
  'Whiteboards',
  'Signs & Posters',
  'Screens',
] as const;

const BENEFITS = [
  {
    title: 'Your Photos Stay Private',
    description:
      'Everything happens right here in your browser. We never see, store, or upload your images anywhere. Perfect for sensitive documents.',
  },
  {
    title: 'No Waiting Around',
    description:
      'Since there\'s no server upload, you see the corrected result instantly as you move the corners. Super fast, even on slower connections.',
  },
  {
    title: 'Full Quality, No Watermarks',
    description:
      'Download your fixed image at the original resolution. We don\'t slap a logo on your work—it\'s yours, clean and ready to use.',
  },
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
          Why do your photos end up looking crooked?
        </h2>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          It happens all the time: you&apos;re trying to capture a receipt, a page
          from a book, or notes from a meeting, but you can&apos;t get perfectly
          parallel to the surface. This results in a &quot;trapezoid&quot; effect
          where one side is wider than the other, making text look stretched and
          hard to read.
        </p>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          PerspectiveFix solves this by using a professional-grade{' '}
          <strong>perspective warp</strong> algorithm. By simply marking the four
          corners of your document, the tool mathematically &quot;pulls&quot; the
          image flat, giving you a clean, rectangular result as if it were
          scanned by a high-end office scanner.
        </p>
      </section>

      <section aria-labelledby="use-cases-heading">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <h2
            id="use-cases-heading"
            className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground"
          >
            Designed for your everyday needs:
          </h2>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EVERYDAY_NEEDS.map((useCase) => (
            <li
              key={useCase}
              className="p-4 rounded-xl border border-border/70 bg-surface text-sm text-foreground"
            >
              {useCase}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="works-with-heading">
        <h2
          id="works-with-heading"
          className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground text-center mb-6"
        >
          Works Great With
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {WORKS_WITH.map((item) => (
            <li
              key={item}
              className="p-4 rounded-xl border border-border/70 bg-surface text-sm text-foreground text-center"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="benefits-heading">
        <h2
          id="benefits-heading"
          className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground text-center mb-6"
        >
          Why People Love This Tool
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="p-6 rounded-2xl border border-border/70 bg-surface"
            >
              <h3 className="text-base font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                {benefit.description}
              </p>
            </div>
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
