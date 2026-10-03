import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary';

/** Class names for a button look, for links that must look like buttons. */
export function buttonClass(variant: ButtonVariant): string {
  return `ui-btn ui-btn-${variant}`;
}

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Exactly one primary button per screen. */
  readonly variant?: ButtonVariant;
}

export function Button({ variant = 'secondary', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant)} {...rest} />;
}
