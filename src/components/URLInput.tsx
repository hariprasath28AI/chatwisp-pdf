
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { validateClaudeURL } from '@/utils/validation';

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const URLInput: React.FC<URLInputProps> = ({
  value,
  onChange,
  className,
  placeholder = "Enter Claude share URL (https://claude.ai/share/...)",
  disabled = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Validate URL on blur, but only if there's a value
  const handleBlur = () => {
    setIsFocused(false);
    if (value.trim() && !validateClaudeURL(value)) {
      setError("Please enter a valid Claude share URL");
    }
  };

  // Clear error when user starts typing again
  useEffect(() => {
    if (value.trim() === "") {
      setError(null);
    } else if (error && validateClaudeURL(value)) {
      setError(null);
    }
  }, [value, error]);

  return (
    <div className="w-full space-y-2 animate-fade-in">
      <div 
        className={cn(
          "relative transition-all duration-300 rounded-xl",
          isFocused ? "shadow-soft" : "",
          error ? "shadow-soft ring-1 ring-destructive/30" : ""
        )}
      >
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          className={cn(
            "w-full px-4 py-3 h-12 text-base bg-white dark:bg-black/50 rounded-xl border-input transition-all duration-300",
            error ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-ring/20",
            disabled ? "opacity-70 cursor-not-allowed" : "",
            className
          )}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      
      {error && (
        <p className="text-sm text-destructive animate-slide-down ml-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default URLInput;
