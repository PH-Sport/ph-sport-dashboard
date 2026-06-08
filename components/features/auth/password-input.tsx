'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { TRANSITIONS } from '@/components/ui/animations';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  className?: string;
}

/** Input de password con toggle eye/eyeOff y animación. */
export function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••',
  required,
  disabled,
  minLength,
  className,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name ?? id}
        type={show ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn('h-11 pr-10', className)}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        tabIndex={-1}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={show ? 'visible' : 'hidden'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={TRANSITIONS.fade}
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </motion.div>
        </AnimatePresence>
      </button>
    </div>
  );
}
