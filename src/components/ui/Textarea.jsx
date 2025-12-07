import React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white",
        "placeholder:text-gray-500",
        "focus:outline-none focus:ring-2 focus:ring-[#5DA781] focus:ring-offset-2 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-vertical",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export { Textarea };