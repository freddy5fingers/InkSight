
import React, { useState } from 'react';
import { TattooConcept } from '../types';
import { BookmarkIcon, ShareIcon, DownloadIcon, LocationMarkerIcon, PaletteIcon, SparklesIcon, AdjustmentsIcon } from './icons';
import FadeIn from './animations/FadeIn';
import { refineTattooImage } from '../services/geminiService';
import TattooEditor from './TattooEditor';

interface ResultCardProps {
  concept: TattooConcept;
  onSave: (concept: TattooConcept) => void;
  isSaved: boolean;
  isLoading?: boolean;
  onImageRefined: (newImage: string, variationIndex: number) => void;
}

const ResultCardSkeleton: React.FC = () => (
    <div className="glass-card rounded-3xl overflow-hidden">
        <div className="p-8 animate-pulse">
            <div className="h-8 bg-white/10 rounded-md w-3/4 mx-auto mb-3"></div>
            <div className="h-4 bg-white/10 rounded-md w-full max-w-lg mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 p-8 pt-0 animate-pulse">
            <div className="md:col-span-3 flex flex-col items-center">
                <div className="w-full h-auto aspect-square object-cover rounded-2xl bg-white/10"></div>
                <div className="flex space-x-2 mt-4 w-full">
                    <div className="flex-1 h-12 bg-white/10 rounded-lg"></div>
                    <div className="flex-1 h-12 bg-white/10 rounded-lg"></div>
                </div>
            </div>
            <div className="md:col-span-2 space-y-6">
                <div>
                  <div className="h-6 w-1/2 bg-white/10 rounded-md mb-3"></div>
                  <div className="h-4 w-full bg-white/10 rounded-md"></div>
                  <div className="h-4 w-3/4 bg-white/10 rounded-md mt-2"></div>
                </div>
                <div>
                  <div className="h-6 w-1/3 bg-white/10 rounded-md mt-4 mb-3"></div>
                  <div className="h-24 w-full bg-white/10 rounded-lg"></div>
                </div>
            </div>
        </div>
    </div>
);

const QUICK_REFINEMENTS = [
  "Make it minimalist",
  "Add shading",
  "Thicker outlines",
  "Add floral details",
  "Geometric style",
  "Make it symmetrical"
];

const ResultCard: React.FC<ResultCardProps> = ({ concept, onSave, isSaved, isLoading, onImageRefined }) => {
  const [activeVariationIndex, setActiveVariationIndex] = useState(0);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);

  if (isLoading) {
    return <ResultCardSkeleton />;
  }

  const activeVariation = concept.variations?.[activeVariationIndex];

  if (!activeVariation) {
    return (
      <FadeIn>
        <div className="glass-card rounded-3xl overflow-hidden p-8">
          <h2 className="text-3xl md:text-4xl text-center font-bold font-sora tracking-tight text-white">
            {concept.concept_name}
          </h2>
          <p className="text-center text-red-400 mt-4">Error: Could not display tattoo concept because no design variations were found.</p>
        </div>
      </FadeIn>
    );
  }

  const handleShare = () => {
    const shareText = `Check out my AI-generated tattoo: "${concept.concept_name}"!\n\n${concept.summary}\n\nStyle: ${activeVariation.style_name}`;
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Tattoo idea copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = activeVariation.image;
    link.download = `${concept.concept_name.replace(/\s+/g, '_')}_${activeVariation.style_name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleRefineImage = async () => {
    if (!editPrompt.trim() || !activeVariation) return;

    setIsEditing(true);
    setEditError(null);
    try {
      const newImage = await refineTattooImage(activeVariation.image, editPrompt);
      onImageRefined(newImage, activeVariationIndex);
      setEditPrompt('');
    } catch (err: any) {
      setEditError(err.message || 'Failed to refine image. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const InfoPill: React.FC<{ icon: React.ReactNode, title: string, content: string | string[] | undefined }> = ({ icon, title, content }) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;
    return (
      <div className="bg-black/20 p-4 rounded-xl border border-white/10">
        <h4 className="flex items-center text-sm font-bold font-sora text-blue-300 mb-2">
          {icon}
          <span className="ml-2">{title}</span>
        </h4>
        {Array.isArray(content) ? (
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 font-sora">
            {content.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        ) : (
          <p className="text-gray-300 text-sm font-sora">{content}</p>
        )}
      </div>
    );
  };

  return (
    <>
      {showAdvancedEditor && (
        <TattooEditor 
          baseImage={activeVariation.image} 
          onClose={() => setShowAdvancedEditor(false)} 
        />
      )}
      
      <FadeIn>
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl md:text-4xl text-center font-bold font-sora tracking-tight text-white">
              {concept.concept_name}
            </h2>
            <p className="text-center text-gray-300 mt-2 font-sora">{concept.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 p-8 pt-0">
            {/* Left Column: Image and Variations */}
            <div className="md:col-span-3 flex flex-col items-center">
              <div className="relative w-full group">
                  <img
                      src={activeVariation.image}
                      alt={`Tattoo design for ${concept.concept_name} in ${activeVariation.style_name} style`}
                      className={`w-full h-auto aspect-square object-cover rounded-2xl border-2 border-white/10 shadow-lg shadow-black/30 transition-all duration-300 ease-in-out ${isEditing ? 'opacity-50' : ''}`}
                  />
                  <button 
                    onClick={() => setShowAdvancedEditor(true)}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all transform hover:scale-110 border border-white/20 shadow-xl z-10 group-hover:opacity-100 opacity-0"
                    title="Open Editor Studio"
                  >
                    <AdjustmentsIcon className="h-6 w-6" />
                  </button>

                  {isEditing && (
                      <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-400"></div>
                      </div>
                  )}
              </div>
              {concept.variations.length > 1 && (
                <div className="flex space-x-2 mt-4 w-full">
                  {concept.variations.map((v, index) => (
                    <button
                      key={v.style_name}
                      onClick={() => setActiveVariationIndex(index)}
                      className={`flex-1 p-3 rounded-lg transition-all text-sm font-semibold font-sora ${activeVariationIndex === index ? 'bg-white/20 text-white scale-105 shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                    >
                      {v.style_name}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-400 mt-3 text-center h-8 font-sora">{activeVariation.short_description}</p>
            
              <FadeIn delay={100} className="w-full mt-6">
                <div className="p-5 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/10 shadow-lg backdrop-blur-sm">
                  <h4 className="flex items-center text-sm font-bold font-sora text-purple-300 mb-4">
                    <SparklesIcon className="h-5 w-5 mr-2 text-purple-400" />
                    Magic Refine
                  </h4>
                  
                  <div className="relative group">
                    <input
                      type="text"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      onKeyDown={(e) => { if(e.key === 'Enter') handleRefineImage(); }}
                      placeholder="Describe changes (e.g., 'add a halo')..."
                      disabled={isEditing}
                      className="w-full bg-white/90 border border-white/10 rounded-xl p-4 pr-28 text-black focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-gray-500 font-sora text-sm shadow-inner"
                    />
                    <button 
                      onClick={handleRefineImage} 
                      disabled={isEditing || !editPrompt.trim()} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transform transition-all hover:scale-105 text-xs font-bold font-sora tracking-wide shadow-lg"
                    >
                      {isEditing ? 'Refining...' : 'GENERATE'}
                    </button>
                  </div>
                  
                  {editError && <p className="text-red-400 text-xs mt-3 text-center bg-red-900/20 p-2 rounded border border-red-900/50">{editError}</p>}

                  <div className="mt-4">
                      <p className="text-xs text-gray-500 font-sora mb-2 uppercase tracking-wider font-semibold">Quick Actions</p>
                      <div className="flex flex-wrap gap-2">
                          {QUICK_REFINEMENTS.map((action) => (
                              <button
                                  key={action}
                                  onClick={() => setEditPrompt(action)}
                                  disabled={isEditing}
                                  className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 rounded-full px-3 py-1.5 text-gray-300 hover:text-white transition-all font-sora disabled:opacity-50"
                              >
                                  {action}
                              </button>
                          ))}
                      </div>
                  </div>
                </div>
              </FadeIn>
              
              {/* Studio Button */}
              <FadeIn delay={150} className="w-full mt-3">
                 <button 
                    onClick={() => setShowAdvancedEditor(true)}
                    className="w-full flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-white/20 transition-all transform hover:scale-[1.02] text-gray-200 font-bold font-sora"
                 >
                     <AdjustmentsIcon className="h-5 w-5 mr-2" />
                     Open Design Studio
                 </button>
              </FadeIn>
            </div>

            {/* Right Column: Details and Actions */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="font-sora text-xl text-purple-300">Meaning & Symbols</h3>
                <div className="space-y-2 mt-2">
                  {concept.meaning_and_symbols.map((item, i) => (
                    <div key={i} className="text-sm font-sora">
                      <span className="font-semibold text-gray-200">{item.symbol}:</span>
                      <span className="text-gray-300 ml-2">{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoPill icon={<LocationMarkerIcon className="h-5 w-5" />} title="Placement Ideas" content={concept.placement_suggestions} />
                <InfoPill icon={<PaletteIcon className="h-5 w-5" />} title="Color Palette" content={concept.color_palette_hint} />
              </div>

              <div>
                <h3 className="font-sora text-xl text-blue-300">Artist Prompt</h3>
                <p className="text-gray-300 text-sm mt-2 bg-black/20 p-4 rounded-xl border border-white/10 max-h-40 overflow-y-auto">{concept.artist_prompt}</p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => onSave(concept)}
                  className={`flex-1 flex items-center justify-center p-3 rounded-lg transition-all font-sora text-sm font-semibold shadow-sm hover:shadow-lg hover:scale-105 ${isSaved ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  aria-label={isSaved ? "Unsave Idea" : "Save Idea"}
                >
                  <BookmarkIcon className="h-5 w-5 mr-2" />
                  {isSaved ? 'Saved' : 'Save Idea'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center p-3 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-all text-sm font-semibold font-sora shadow-sm hover:shadow-lg hover:scale-105"
                  aria-label="Share Idea"
                >
                  <ShareIcon className="h-5 w-5 mr-2" />
                  Share
                </button>
                <button onClick={handleDownload} className="relative group flex-1 flex items-center justify-center p-3 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-all text-sm font-semibold font-sora shadow-sm hover:shadow-lg hover:scale-105" aria-label="Download HD">
                  <DownloadIcon className="h-5 w-5 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </>
  );
};

export default ResultCard;
