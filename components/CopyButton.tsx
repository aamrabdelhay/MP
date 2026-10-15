"use client";

import { useState } from "react";
import { Copy, LoaderCircle } from "lucide-react";

type CopyButtonProps = {
  value: string;
  label: string;
  accessibleLabel: string;
  variant?: "icon" | "text";
  className?: string;
  disabled?: boolean;
  onCopied: () => void | Promise<void>;
  onFailure: () => void;
};

export async function copyTextToClipboard(value: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Continue to the textarea fallback below (e.g. older browsers or denied permission).
  }

  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let textarea: HTMLTextAreaElement | null = null;
  try {
    textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.setAttribute("aria-hidden", "true");
    textarea.style.position = "fixed";
    textarea.style.insetInlineStart = "-9999px";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    if (textarea?.parentNode) textarea.parentNode.removeChild(textarea);
    previousFocus?.focus();
  }
}

export function CopyButton({
  value,
  label,
  accessibleLabel,
  variant = "icon",
  className,
  disabled,
  onCopied,
  onFailure,
}: CopyButtonProps) {
  const [copying, setCopying] = useState(false);

  async function handleCopy() {
    if (copying || disabled) return;
    setCopying(true);
    try {
      const copied = await copyTextToClipboard(value);
      if (copied) await onCopied();
      else onFailure();
    } catch {
      onFailure();
    } finally {
      setCopying(false);
    }
  }

  const classes = className ?? (variant === "icon" ? "request-data-copy" : "copy-all-button");

  return (
    <button
      type="button"
      className={classes}
      onClick={handleCopy}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      disabled={disabled || copying}
    >
      {copying ? (
        <LoaderCircle aria-hidden="true" size={variant === "icon" ? 15 : 16} className="button-spinner" />
      ) : (
        <Copy aria-hidden="true" size={variant === "icon" ? 15 : 16} strokeWidth={1.9} />
      )}
      {variant === "text" ? <span>{label}</span> : null}
    </button>
  );
}
