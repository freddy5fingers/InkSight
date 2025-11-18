
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SparklesIcon } from '../icons';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="glass-card rounded-3xl shadow-2xl w-full max-w-md p-8 text-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-200 text-3xl font-bold">&times;</button>
        <h2 className="text-2xl font-sora font-bold text-gray-100 mb-4">Manage Account</h2>
        <p className="text-gray-300 mb-8 font-sora">Switch between a Free or Premium account to experience all features.</p>
        
        <div className="space-y-4">
          <button
            onClick={() => { login('free'); onClose(); }}
            className="w-full text-center p-4 rounded-xl bg-black/20 hover:bg-black/40 transition-all transform hover:scale-105 border-2 border-white/10 hover:border-white/20"
          >
            <h3 className="font-bold text-lg text-gray-200 font-sora">Continue as Free User</h3>
            <p className="text-sm text-gray-300 font-sora">Limited to 3 saved ideas & standard quality images.</p>
          </button>
          <button
            onClick={() => { login('premium'); onClose(); }}
            className="w-full text-center p-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
          >
             <h3 className="font-bold text-lg text-white flex items-center justify-center font-sora"><SparklesIcon className="h-5 w-5 mr-2" /> Continue as Premium User</h3>
            <p className="text-sm text-purple-200 font-sora">Unlimited saves & HD image downloads.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;