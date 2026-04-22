import { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'
import React, { forwardRef } from 'react'

interface FormFieldProps {
  label: string
  error?: FieldError | string
  children?: React.ReactNode
  required?: boolean
  className?: string
  helpText?: string
}

export function FormField({
  label,
  error,
  children,
  required,
  className,
  helpText,
}: FormFieldProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {helpText && !errorMessage && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError | string
  register?: UseFormRegisterReturn
  helpText?: string
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  error,
  className,
  helpText,
  required,
  register,
  ...props
}, externalRef) => {
  const { ref: registerRef, ...restRegister } = register || {};

  const setRefs = (element: HTMLInputElement | null) => {
    // Set the register ref
    if (registerRef) {
      if (typeof registerRef === 'function') {
        registerRef(element);
      } else if (registerRef && 'current' in registerRef) {
        (registerRef as React.MutableRefObject<HTMLInputElement | null>).current = element;
      }
    }
    // Set the external ref
    if (externalRef) {
      if (typeof externalRef === 'function') {
        externalRef(element);
      } else if (externalRef && 'current' in externalRef) {
        (externalRef as React.MutableRefObject<HTMLInputElement | null>).current = element;
      }
    }
  };

  return (
    <FormField label={label} error={error} required={required} helpText={helpText}>
      <input
        {...props}
        {...restRegister}
        ref={setRefs}
        className={cn(
          'w-full px-4 py-2 border rounded-lg text-sm transition-colors bg-background',
          'focus:ring-2 focus:ring-primary focus:border-primary outline-none',
          error
            ? 'border-destructive focus:ring-destructive focus:border-destructive'
            : 'border-input',
          className
        )}
      />
    </FormField>
  );
});

InputField.displayName = 'InputField';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: FieldError | string
  options: { value: string; label: string; disabled?: boolean }[]
  helpText?: string
  register?: UseFormRegisterReturn
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(({
  label,
  error,
  register,
  options,
  className,
  helpText,
  required,
  ...props
}, externalRef) => {
  const { ref: registerRef, ...restRegister } = register || {};

  const setRefs = (element: HTMLSelectElement | null) => {
    if (registerRef) {
      if (typeof registerRef === 'function') {
        registerRef(element);
      } else if (registerRef && 'current' in registerRef) {
        (registerRef as React.MutableRefObject<HTMLSelectElement | null>).current = element;
      }
    }
    if (externalRef) {
      if (typeof externalRef === 'function') {
        externalRef(element);
      } else if (externalRef && 'current' in externalRef) {
        (externalRef as React.MutableRefObject<HTMLSelectElement | null>).current = element;
      }
    }
  };

  return (
    <FormField label={label} error={error} required={required} helpText={helpText}>
      <select
        {...restRegister}
        {...props}
        ref={setRefs}
        className={cn(
          'w-full px-4 py-2 border rounded-lg text-sm transition-colors bg-background',
          'focus:ring-2 focus:ring-primary focus:border-primary outline-none',
          error
            ? 'border-destructive focus:ring-destructive focus:border-destructive'
            : 'border-input',
          className
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
});

SelectField.displayName = 'SelectField';

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: FieldError | string
  register?: UseFormRegisterReturn
  helpText?: string
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(({
  label,
  error,
  register,
  className,
  helpText,
  required,
  rows = 3,
  ...props
}, externalRef) => {
  const { ref: registerRef, ...restRegister } = register || {};

  const setRefs = (element: HTMLTextAreaElement | null) => {
    if (registerRef) {
      if (typeof registerRef === 'function') {
        registerRef(element);
      } else if (registerRef && 'current' in registerRef) {
        (registerRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = element;
      }
    }
    if (externalRef) {
      if (typeof externalRef === 'function') {
        externalRef(element);
      } else if (externalRef && 'current' in externalRef) {
        (externalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = element;
      }
    }
  };

  return (
    <FormField label={label} error={error} required={required} helpText={helpText}>
      <textarea
        {...restRegister}
        {...props}
        rows={rows}
        ref={setRefs}
        className={cn(
          'w-full px-4 py-2 border rounded-lg text-sm transition-colors resize-none bg-background',
          'focus:ring-2 focus:ring-primary focus:border-primary outline-none',
          error
            ? 'border-destructive focus:ring-destructive focus:border-destructive'
            : 'border-input',
          className
        )}
      />
    </FormField>
  );
});

TextAreaField.displayName = 'TextAreaField';
