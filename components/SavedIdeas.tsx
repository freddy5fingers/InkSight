
import React from 'react';
import { TattooConcept } from '../types';
import { TrashIcon } from './icons';
import FadeIn from './animations/FadeIn';

interface SavedIdeasProps {
  savedIdeas: TattooConcept[];
  onRemove: (id: string) => void;
  onSelect: (concept: TattooConcept) => void;
}

const SavedIdeas: React.FC<SavedIdeasProps> = ({ savedIdeas, onRemove, onSelect }) => {
  if (savedIdeas.length === 0) {
    return null;
  }

  return (
    <FadeIn delay={200} className="w-full max-w-7xl mx-auto mt-16 p-4">
      <div className="flex justify-center items-center mb-6">
        <h2 className="text-3xl font-sora font-bold text-center text-gray-200">Saved Ideas</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {savedIdeas
          .filter(idea => idea && idea.variations && idea.variations.length > 0)
          .map((idea) => (
          <div key={idea.id} className="group relative aspect-square cursor-pointer" onClick={() => onSelect(idea)}>
            <img 
              src={idea.variations[0].image} 
              alt={idea.concept_name} 
              className="w-full h-full object-cover rounded-xl border-2 border-white/10 group-hover:border-blue-400 transition-all duration-300 shadow-md group-hover:shadow-xl group-hover:shadow-blue-500/20"
            />
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(idea.id);
                }}
                className="p-3 bg-red-600/80 hover:bg-red-500 rounded-full text-white transition-all transform hover:scale-110"
                aria-label="Remove saved idea"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </FadeIn>
  );
};

export default SavedIdeas;
