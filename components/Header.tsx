
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-6 flex flex-col items-center">
      <img 
        src="https://initial-chocolate-znir6dm8ze.edgeone.app/Gemini_Generated_Image_h4mje1h4mje1h4mj.png" 
        alt="InkSight Logo" 
        className="h-80 w-80 md:h-96 md:w-96 rounded-full shadow-2xl object-cover border-4 border-white/10"
      />
      <p className="mt-8 text-md md:text-lg text-gray-300 max-w-3xl mx-auto font-sora">
        From fleeting thoughts to timeless ink. Describe your story, emotion, or idea and let our AI create a unique tattoo concept for you.
      </p>
    </header>
  );
};

export default Header;
