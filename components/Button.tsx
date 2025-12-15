
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  icon,
  active,
  className = '',
  disabled,
  ...props 
}) => {
  // Pro Tool Aesthetic: Sharp, minimal, high-contrast, no bloat.
  // Performance: CSS transitions only, no complex DOM.
  const baseStyles = "relative inline-flex items-center justify-center font-sans font-medium transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none select-none rounded-[2px]";
  
  const variants = {
    // Primary: The main action. Subtle cyan tint, sharp border.
    primary: `border border-cyan-900/50 text-cyan-500 hover:bg-cyan-950/30 hover:border-cyan-500/50 hover:text-cyan-400 ${active ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300' : 'bg-[#0a0a0a]'}`,
    
    // Secondary: Standard UI element. Zinc grays.
    secondary: `border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 ${active ? 'bg-zinc-800 border-zinc-500 text-white' : 'bg-transparent'}`,
    
    // Ghost: No border until hover.
    ghost: `text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 ${active ? 'text-cyan-400 bg-cyan-950/20' : ''}`,
    
    // Danger: Destructive.
    danger: "border border-red-900/30 text-red-600 hover:bg-red-950/20 hover:border-red-800 hover:text-red-500 bg-transparent",
  };

  const sizes = {
    xs: "px-2 py-1 text-[10px] gap-1.5",
    sm: "px-3 py-1.5 text-xs gap-2",
    md: "px-4 py-2 text-xs gap-2",
    icon: "p-1.5 aspect-square",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit z-10">
           <span className="w-3 h-3 border-2 border-current border-t-transparent animate-spin opacity-80" />
        </span>
      )}
      
      {/* Content */}
      <span className={`flex items-center justify-center gap-inherit ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {icon && <span className="opacity-90">{icon}</span>}
        {children}
      </span>
    </button>
  );
};
