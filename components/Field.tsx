import type { ReactNode } from "react";
import type { FieldValidity } from "@/lib/validation";
import { DotIndicator } from "@/components/DotIndicator";

type FieldProps = {
  id: string;
  label: string;
  validity: FieldValidity;
  validLabel: string;
  invalidLabel: string;
  neutralLabel: string;
  optional?: boolean;
  optionalLabel?: string;
  hint?: string;
  errorHint?: string;
  wide?: boolean;
  children: ReactNode;
};

export function Field({
  id,
  label,
  validity,
  validLabel,
  invalidLabel,
  neutralLabel,
  optional,
  optionalLabel,
  hint,
  errorHint,
  wide,
  children,
}: FieldProps) {
  return (
    <div className={`field${wide ? " field--wide" : ""}`}>
      <div className="field-label-row">
        <label className="field-label" htmlFor={id}>
          <DotIndicator
            validity={validity}
            validLabel={validLabel}
            invalidLabel={invalidLabel}
            neutralLabel={neutralLabel}
          />
          <span>{label}</span>
        </label>
        {optional ? <span className="optional-tag">{optionalLabel}</span> : null}
      </div>
      {children}
      {errorHint ? <p className="field-hint field-hint--error" id={`${id}-hint`}>{errorHint}</p> : hint ? <p className="field-hint" id={`${id}-hint`}>{hint}</p> : null}
    </div>
  );
}
