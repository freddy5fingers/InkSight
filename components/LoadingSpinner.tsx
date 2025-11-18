
import React, { useState, useEffect } from 'react';
import Typewriter from './animations/Typewriter';

const tattooIdeas = [
  'A minimalist wave on the wrist...',
  'Geometric wolf head on the forearm...',
  'Watercolor galaxy on the shoulder blade...',
  'Fine-line floral bouquet wrapping the ankle...',
  'A traditional style ship on a stormy sea...',
  'Neo-traditional raven holding a key...',
  'Blackwork mandala covering the back...',
  'The phases of the moon down the spine...',
  'A phoenix rising from ashes in vibrant color...',
  'Constellation map of a significant date...',
  'Biomechanical gears tearing through skin...',
  'A single continuous line forming an animal...',
];

const LoadingSpinner: React.FC = () => {
  const [ideaIndex, setIdeaIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdeaIndex(prevIndex => (prevIndex + 1) % tattooIdeas.length);
    }, 3000); // Change idea every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400"></div>
      <div className="text-center">
        <h3 className="text-gray-400 font-sora text-sm uppercase tracking-widest mb-2">Inkspiration while you wait...</h3>
        <div className="text-gray-200 font-sora text-lg tracking-wider min-h-[3rem] flex items-center justify-center">
          <Typewriter text={tattooIdeas[ideaIndex]} speed={50} />
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
