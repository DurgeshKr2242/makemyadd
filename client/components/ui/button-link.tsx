/**
 * <ButtonLink> — a Next `Link` styled with our shared `buttonVariants`.
 *
 * Why this exists, and not `<Button render={<Link />}>`:
 *
 * Base UI's <Button> defaults to `nativeButton: true` — it expects a real
 * <button> in the DOM. Forcing it to `render={<Link />}` produces an
 * <a> tag, which (a) emits a runtime warning, (b) mismatches between
 * SSR and client because Base UI's class merger handles the wrapped
 * className differently per environment (causing `group` and other
 * variant classes to flicker on hydration).
 *
 * Use this whenever the visual is button-shaped but the action is
 * navigation. Use the real <Button> only for actual button actions
 * (onClick handlers, form submits, dropdown triggers).
 */
import type { VariantProps } from "class-variance-authority";
import Link, { type LinkProps } from "next/link";
import type { ComponentProps } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnchorAttrs = Omit<ComponentProps<"a">, keyof LinkProps>;

export type ButtonLinkProps = LinkProps &
  AnchorAttrs &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

export function ButtonLink({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      data-slot="button-link"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Link>
  );
}
