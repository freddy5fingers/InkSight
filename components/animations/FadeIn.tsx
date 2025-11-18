
import React, { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  duration = 500,
  delay = 0,
  className = '',
}) => {
  const style: React.CSSProperties = {
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`,
    animationFillMode: 'forwards',
  };

  return (
    <div style={style} className={`animate-fade-in-up opacity-0 ${className}`}>
      {children}
    </div>
  );
};

// Add this to your global CSS or tailwind.config.js if you can
// For now, let's assume a style tag or similar setup would define this animation.
// In a real Next.js app, this would be in styles/globals.css
/*
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation-name: fadeInUp;
}
*/

export default FadeIn;
