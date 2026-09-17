import React from 'react';

export const GlassContainer: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-4 ${className}`}>
    {children}
  </div>
);
