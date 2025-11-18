import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { StarIcon } from '../icons';

interface PremiumModalProps {
  onClose: () => void;
}

const PremiumPlanCard: React.FC<{
  title: string;
  price: string;
  description: string;
  isPopular?: boolean;
  isLifetime?: boolean;
  onSelect: () => void;
}> = ({ title, price, description, isPopular, isLifetime, onSelect }) => {
  return (
    <div className={`relative p-6 rounded-2xl border-2 transition-all transform hover:scale-105 hover:border-blue-400 ${
        isPopular 
        ? 'bg-blue-900/30 border-blue-500' 
        : 'bg-black/20 border-white/10'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full flex items-center shadow-lg">
          <StarIcon className="h-3 w-3 mr-1.5" />
          Best Value
        </div>
      )}
      <h3 className="font-sora text-xl font-bold text-white">{title}</h3>
      <p className="font-sora mt-2">
        <span className="text-3xl font-bold text-white">{price}</span>
        <span className="text-gray-400">{isLifetime ? '' : '/mo'}</span>
      </p>
      <p className="text-sm text-gray-300 mt-3 min-h-[40px]">{description}</p>
      <button
        onClick={onSelect}
        className={`w-full mt-6 text-center p-3 rounded-lg font-bold font-sora transition-all transform hover:scale-105 shadow-lg ${
            isPopular 
            ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/30'
            : isLifetime
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-purple-500/30'
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        {isLifetime ? 'Get Lifetime Access' : `Choose ${title}`}
      </button>
    </div>
  );
};


const PremiumModal: React.FC<PremiumModalProps> = ({ onClose }) => {
  const { login } = useAuth();
  
  const handleSelectPlan = () => {
    login('premium');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="glass-card border-2 border-blue-500/30 rounded-3xl shadow-2xl shadow-blue-500/20 w-full max-w-4xl p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-200 text-3xl font-bold">&times;</button>
        
        <div className="text-center mb-8">
            <h2 className="text-3xl font-sora font-bold text-white">
              Upgrade to Inksight Premium
            </h2>
            <p className="text-gray-300 mt-2 font-sora">Unlock unlimited generations, HD images, advanced styles, and more.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PremiumPlanCard 
                title="Monthly"
                price="$9.99"
                description="Perfect for short-term projects and trying out all features."
                onSelect={handleSelectPlan}
            />
             <PremiumPlanCard 
                title="Yearly"
                price="$59"
                description="Save over 50%! The best option for tattoo enthusiasts."
                isPopular
                onSelect={handleSelectPlan}
            />
             <PremiumPlanCard 
                title="Lifetime"
                price="$39"
                description="One-time payment. Own Inksight forever. (Limited time offer)"
                isLifetime
                onSelect={handleSelectPlan}
            />
        </div>

        <div className="text-center mt-8 text-xs text-gray-500 space-y-2">
            <p>
                Payments are processed securely by Stripe. We support all major credit cards, Apple Pay, and Google Pay.
            </p>
            <p className="font-semibold">
                30-Day Money-Back Guarantee
            </p>
        </div>

      </div>
    </div>
  );
};

export default PremiumModal;
