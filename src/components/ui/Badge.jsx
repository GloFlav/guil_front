// BADGE COMPONENT (créer seulement si @/components/ui/Badge n'existe pas)

import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-700',
  }; 

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export { Badge };

// NOTE: Ce composant n'est nécessaire que si Badge n'existe pas déjà dans votre UI library.
// Si vous utilisez shadcn/ui ou une autre library, utilisez le Badge existant.