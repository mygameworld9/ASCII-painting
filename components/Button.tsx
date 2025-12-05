import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'cyber';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  // Base: Sharp fonts, uppercase, tracking wide, zero rounded corners default
  const baseStyles = "relative inline-flex items-center justify-center gap-2 font-mono font-bold tracking-wider uppercase transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none group overflow-hidden select-none";
  
  const variants = {
    // Primary: Angled cut, cyan glow
    primary: "bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.05)] hover:shadow-[0_0_20px_rgba(0,243,255,0.2)] clip-corner",
    
    // Secondary: Flat industrial
    secondary: "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-none",
    
    // Ghost: Minimal
    ghost: "bg-transparent hover:bg-white/5 text-zinc-500 hover:text-cyan-300",
    
    // Danger: Red alert
    danger: "bg-red-950/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 hover:border-red-500/50 rounded-sm",
    
    // Cyber: Heavy border, glitch aesthetic
    cyber: "bg-black text-cyan-400 border border-cyan-800 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(0,243,255,0.4)] clip-corner-top",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-5 py-2.5 text-xs",
    lg: "px-8 py-4 text-sm",
    icon: "p-2 aspect-square",
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
           <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent animate-spin opacity-100" />
        </span>
      )}
      
      {/* Content */}
      <span className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'} z-0`}>
        {icon && <span className="opacity-80 group-hover:opacity-100 group-hover:text-cyan-300 transition-colors">{icon}</span>}
        {children}
      </span>
      
      {/* Primary variant tech decoration */}
      {variant === 'primary' && (
         <>
           {/* Tiny corner bracket visual */}
           <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyan-400 opacity-60" />
           <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyan-400 opacity-60" />
         </>
      )}
    </button>
  );
};