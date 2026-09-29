import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'link';
  children: ReactNode;
};

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn',
  link: 'btn-link',
};

export function Button({ variant = 'secondary', className, type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={[variantClass[variant], className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </button>
  );
}

type ButtonLinkProps = { href: string; variant?: 'primary' | 'secondary'; children: ReactNode };

export function ButtonLink({ href, variant = 'secondary', children }: ButtonLinkProps) {
  return (
    <a className={variantClass[variant]} href={href}>
      {children}
    </a>
  );
}
