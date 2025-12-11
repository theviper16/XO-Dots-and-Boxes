import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  themeStyle: string;
  variant?: 'primary' | 'secondary' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({ 
  className = '', 
  children, 
  themeStyle, 
  variant = 'primary',
  ...props 
}) => {
  const baseClass = "transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  let variantClass = themeStyle;
  if (variant === 'icon') {
    variantClass = `${themeStyle} p-2 rounded-full flex items-center justify-center`;
  } else {
    variantClass = `${themeStyle} px-6 py-3 rounded uppercase tracking-wider`;
  }

  return (
    <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};