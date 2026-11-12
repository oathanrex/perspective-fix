import type { ComponentProps } from 'react';

/**
 * inset is reserved strictly for recessed interactive wells (canvas stage, file dropzone),
 * never for metric or callout sub-boxes inside cards or panels.
 */
export const Surface = ({
  inset = false,
  className = '',
  ...props
}: ComponentProps<'div'> & { inset?: boolean }) => (
  <div
    className={`min-w-0 [:where(&)]:rounded-card [:where(&)]:text-foreground ${
      inset
        ? '[:where(&)]:bg-well [:where(&)]:border [:where(&)]:border-border'
        : '[:where(&)]:bg-surface [:where(&)]:border [:where(&)]:border-border [:where(&)]:shadow-surface'
    } ${className}`}
    {...props}
  />
);

const buttonTones = {
  primary:
    '[:where(&)]:bg-primary [:where(&)]:text-primary-foreground hover:bg-primary-hover',
  quiet:
    '[:where(&)]:border [:where(&)]:border-border [:where(&)]:bg-surface [:where(&)]:text-foreground hover:bg-accent-soft',
  ghost:
    '[:where(&)]:bg-transparent [:where(&)]:text-muted hover:text-foreground hover:bg-accent-soft',
};

export const Button = ({
  tone = 'primary',
  type = 'button',
  className = '',
  ...props
}: ComponentProps<'button'> & { tone?: keyof typeof buttonTones }) => (
  <button
    type={type}
    className={`[:where(&)]:inline-flex [:where(&)]:min-h-11 [:where(&)]:items-center [:where(&)]:justify-center [:where(&)]:gap-2 whitespace-nowrap [:where(&)]:rounded-control [:where(&)]:px-3.5 [:where(&)]:text-sm [:where(&)]:font-medium transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${buttonTones[tone]} ${className}`}
    {...props}
  />
);
