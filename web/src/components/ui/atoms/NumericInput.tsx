'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEventHandler,
} from 'react';
import { clsx } from 'clsx';

type SharedOmit = 'type' | 'inputMode';

/**
 * Native number input with string state so the field can be cleared while editing.
 * Parent: `value` + `onChange(e => setX(e.target.value))`, parse on submit.
 */
export type NumericInputProps = Omit<ComponentProps<'input'>, SharedOmit> & {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  inputMode?: 'numeric' | 'decimal';
};

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(function NumericInput(
  { className, inputMode, step, ...rest },
  ref
) {
  const decimal =
    typeof step === 'string'
      ? step !== '1' && step.includes('.')
      : typeof step === 'number' && !Number.isInteger(step);
  return (
    <input
      ref={ref}
      type="number"
      inputMode={inputMode ?? (decimal ? 'decimal' : 'numeric')}
      className={clsx('input-field', className)}
      step={step}
      {...rest}
    />
  );
});

export type NumericInputNumberProps = Omit<ComponentProps<'input'>, SharedOmit | 'value' | 'onChange'> & {
  value: number;
  onValueChange: (value: number) => void;
  inputMode?: 'numeric' | 'decimal';
};

/**
 * Number in parent state; keeps a string buffer while typing so clearing does not force 0.
 * Clamps to min/max on blur; live updates parent only when the current text parses as a finite number (no clamp until blur).
 */
export const NumericInputNumber = forwardRef<HTMLInputElement, NumericInputNumberProps>(function NumericInputNumber(
  { value, onValueChange, className, min, max, step, onFocus, onBlur, inputMode, ...rest },
  ref
) {
  const [text, setText] = useState(() => String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(String(value));
    }
  }, [value]);

  const clamp = useCallback(
    (n: number) => {
      let x = n;
      if (typeof min === 'number' && Number.isFinite(min)) x = Math.max(min, x);
      if (typeof max === 'number' && Number.isFinite(max)) x = Math.min(max, x);
      return x;
    },
    [min, max]
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const v = event.target.value;
    setText(v);
    const t = v.trim();
    if (t === '' || !Number.isFinite(Number(t))) return;
    onValueChange(Number(t));
  };

  const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    focusedRef.current = true;
    onFocus?.(e);
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    focusedRef.current = false;
    const t = text.trim();
    if (t === '' || !Number.isFinite(Number(t))) {
      setText(String(value));
    } else {
      const next = clamp(Number(t));
      onValueChange(next);
      setText(String(next));
    }
    onBlur?.(e);
  };

  const decimal =
    typeof step === 'string'
      ? step !== '1' && step.includes('.')
      : typeof step === 'number' && !Number.isInteger(step);

  return (
    <input
      ref={ref}
      type="number"
      inputMode={inputMode ?? (decimal ? 'decimal' : 'numeric')}
      min={min}
      max={max}
      step={step}
      className={clsx('input-field', className)}
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    />
  );
});
