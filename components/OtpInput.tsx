"use client";
import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  success?: boolean;
  groupLabel: string;
  digitLabel: (n: number, total: number) => string;
};

/** Six separate boxes with a dash in the middle. Handles typing, paste, backspace, arrow keys and SMS/email autofill. */
export default function OtpInput({ value, onChange, onComplete, length = 6, disabled, invalid, success, groupLabel, digitLabel }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const half = Math.floor(length / 2);

  const focusBox = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  // Start with the cursor in the first box so typing works straight away.
  useEffect(() => { refs.current[0]?.focus(); }, []);

  // Put the cursor back on the first box after a wrong code clears the field.
  useEffect(() => {
    if (value === "" && invalid) focusBox(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalid, value]);

  const commit = (next: string, focusAt: number) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) {
      refs.current[length - 1]?.blur();
      onComplete?.(clean);
    } else {
      focusBox(focusAt);
    }
  };

  const typeInto = (i: number, raw: string) => {
    const incoming = raw.replace(/\D/g, "");
    if (!incoming) {
      // the box was emptied
      onChange(digits.map((d, k) => (k === i ? "" : d)).join("").replace(/\s/g, ""));
      return;
    }
    // one digit typed, or several at once (paste / autofill): fill from this box onward
    const head = digits.slice(0, i).join("");
    const tail = digits.slice(i + incoming.length).join("");
    const next = (head + incoming + tail).slice(0, length);
    commit(next, Math.min(i + incoming.length, length - 1));
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        onChange(digits.map((d, k) => (k === i ? "" : d)).join(""));
      } else if (i > 0) {
        onChange(digits.map((d, k) => (k === i - 1 ? "" : d)).join(""));
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft") { e.preventDefault(); focusBox(i - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); focusBox(i + 1); }
  };

  const onPaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!/\d/.test(text)) return;
    e.preventDefault();
    typeInto(i, text);
  };

  return (
    <div className="otp-group" role="group" aria-label={groupLabel}>
      {digits.map((d, i) => (
        <span key={i} className="otp-slot">
          {i === half && <span className="otp-dash" aria-hidden="true" />}
          <input
            ref={(el) => { refs.current[i] = el; }}
            className={`otp-box${d ? " filled" : ""}${invalid ? " invalid" : ""}${success ? " success" : ""}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={digitLabel(i + 1, length)}
            aria-invalid={invalid ? true : undefined}
            disabled={disabled}
            value={d}
            onChange={(e) => typeInto(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={(e) => onPaste(i, e)}
            onFocus={(e) => e.currentTarget.select()}
          />
        </span>
      ))}
    </div>
  );
}
