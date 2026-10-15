import type { FieldValidity } from "@/lib/validation";

type DotIndicatorProps = {
  validity: FieldValidity;
  validLabel: string;
  invalidLabel: string;
  neutralLabel: string;
};

export function DotIndicator({ validity, validLabel, invalidLabel, neutralLabel }: DotIndicatorProps) {
  const label = validity === "valid" ? validLabel : validity === "neutral" ? neutralLabel : invalidLabel;
  const stateClass = validity === "valid" ? "status-dot--valid" : validity === "neutral" ? "status-dot--neutral" : "";

  return <span className={`status-dot ${stateClass}`} role="img" aria-label={label} title={label} />;
}
