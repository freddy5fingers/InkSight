
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ResultCard from './components/ResultCard';
import SavedIdeas from './components/SavedIdeas';
import FadeIn from './components/animations/FadeIn';
import Typewriter from './components/animations/Typewriter';
import {
  generateTattooConcept,
  advanceConversation,
  generatePersonalizedImages,
  ConversationTurn
} from './services/geminiService';
import { TattooConcept, TattooStyle } from './types';
import { TATTOO_STYLES_CONFIG } from './constants';
import { SparklesIcon, ChatBubbleIcon, SendIcon } from './components/icons';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<TattooStyle>(TattooStyle.FINELINE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedConcept, setGeneratedConcept] = useState<TattooConcept | null>(null);
  const [savedIdeas, setSavedIdeas] = useState<TattooConcept[]>([]);
  
  // Personalized Journey
  const [mode, setMode] = useState<'direct' | 'personalized'>('direct');
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  
  const resetJourney = useCallback(() => {
    setConversation([]);
    setCurrentAnswer('');
    setAiSummary(null);
    if (mode === 'personalized') {
        setCurrentQuestion("What inspired you to get a tattoo?");
    } else {
        setCurrentQuestion(null);
    }
  }, [mode]);

  useEffect(() => {
    resetJourney();
  }, [mode, resetJourney]);
  
  useEffect(() => {
    // Load saved ideas from local storage on startup
    try {
      const storedIdeas = localStorage.getItem('savedTattooIdeas');
      if (storedIdeas) {
        // Nested try-catch to handle parsing errors separately from storage access errors
        try {
          const parsedIdeas = JSON.parse(storedIdeas);
          if (Array.isArray(parsedIdeas)) {
            // Filter out any potential nulls/undefineds that might have been stored
            setSavedIdeas(parsedIdeas.filter(Boolean));
          } else {
            console.warn('Saved ideas in localStorage is not an array. Clearing.');
            localStorage.removeItem('savedTattooIdeas');
          }
        } catch (parseError) {
          console.error('Failed to parse saved ideas from localStorage. Clearing.', parseError);
          // If parsing fails, the data is corrupt, so we remove it.
          localStorage.removeItem('savedTattooIdeas');
        }
      }
    } catch (storageError) {
      console.error('Could not access localStorage to load saved ideas.', storageError);
      // If storage is inaccessible, we can't do anything. The app will just have no saved ideas.
    }
  }, []);

  const persistSavedIdeas = (ideas: TattooConcept[]) => {
    try {
      localStorage.setItem('savedTattooIdeas', JSON.stringify(ideas));
    } catch (error) {
      console.error('Could not save ideas to localStorage.', error);
    }
  }

  // DIRECT MODE
  const handleGenerateDirect = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter an idea for your tattoo.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedConcept(null);
    try {
      const concept = await generateTattooConcept(prompt, style);
      setGeneratedConcept(concept);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, style]);

  // PERSONALIZED JOURNEY
  const handleSendAnswer = useCallback(async () => {
    if (!currentAnswer.trim() || !currentQuestion) {
      setError('Please provide an answer to continue your journey.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAiSummary(null);
    
    const newConversation: ConversationTurn[] = [...conversation, { q: currentQuestion, a: currentAnswer }];
    setConversation(newConversation);
    setCurrentAnswer('');
    setCurrentQuestion(null);

    try {
      const response = await advanceConversation(newConversation);
      if (response.status === 'CONTINUE') {
        setAiSummary(response.summary);
        setCurrentQuestion(response.nextQuestion);
      } else if (response.status === 'COMPLETE') {
        setAiSummary("Great! I have enough information. Generating your personalized concept...");
        const finalConcept = await generatePersonalizedImages(response.data, newConversation);
        setGeneratedConcept(finalConcept);
        resetJourney();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setCurrentQuestion(newConversation[newConversation.length - 1].q);
    } finally {
      setIsLoading(false);
    }
  }, [conversation, currentQuestion, currentAnswer, resetJourney]);

  const handleModeChange = (newMode: 'direct' | 'personalized') => {
    setMode(newMode);
    setError(null);
    setGeneratedConcept(null);
    setPrompt('');
  };

  const handleSaveIdea = (concept: TattooConcept) => {
    setSavedIdeas(prev => {
      const isAlreadySaved = prev.some(idea => idea && idea.id === concept.id);
      if (isAlreadySaved) {
        const newIdeas = prev.filter(idea => idea && idea.id !== concept.id);
        persistSavedIdeas(newIdeas);
        return newIdeas;
      }
      const newIdeas = [...prev, concept];
      persistSavedIdeas(newIdeas);
      return newIdeas;
    });
  };
  
  const handleRemoveSavedIdea = (id: string) => {
    setSavedIdeas(prev => {
      const newIdeas = prev.filter(idea => idea.id !== id);
      persistSavedIdeas(newIdeas);
      return newIdeas;
    });
  };
  
  const handleSelectSavedIdea = (concept: TattooConcept) => {
    setGeneratedConcept(concept);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageRefined = (newImage: string, variationIndex: number) => {
    setGeneratedConcept(prevConcept => {
      if (!prevConcept) return null;
      const newConcept = JSON.parse(JSON.stringify(prevConcept)) as TattooConcept;
      if (newConcept.variations && newConcept.variations[variationIndex]) {
        newConcept.variations[variationIndex].image = newImage;
      }
      return newConcept;
    });
  };


  return (
    <>
      <div className="min-h-screen bg-transparent text-gray-200 font-roboto-mono">
        <div className="container mx-auto px-4 py-8">
          <Header />
          
          <main className="mt-10">
            <FadeIn>
              <div className="w-full max-w-3xl mx-auto glass-card p-6 rounded-3xl">
                <div className="flex mb-6 rounded-xl bg-gray-900/50 p-1">
                  <button onClick={() => handleModeChange('direct')} className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-all text-sm font-semibold font-sora ${mode === 'direct' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-300 hover:bg-white/5'}`}>
                    <SparklesIcon className="h-5 w-5 mr-2" /> Direct Idea
                  </button>
                  <button onClick={() => handleModeChange('personalized')} className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-all text-sm font-semibold font-sora ${mode === 'personalized' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-300 hover:bg-white/5'}`}>
                    <ChatBubbleIcon className="h-5 w-5 mr-2" /> Personalized Journey
                  </button>
                </div>

                {mode === 'direct' && (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="prompt" className="block text-sm font-bold font-sora text-blue-300 mb-2">1. Describe Your Idea</label>
                      <textarea id="prompt" rows={3} className="w-full bg-white/90 border-transparent rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-600" placeholder="e.g., a cybernetic phoenix rising from digital ashes..." value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isLoading} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold font-sora text-blue-300 mb-3">2. Choose a Style</label>
                      <div className="flex flex-wrap gap-2">
                        {[...TATTOO_STYLES_CONFIG.free].map((s) => {
                          return (
                            <button 
                              key={s} 
                              onClick={() => setStyle(s)} 
                              className={`relative px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 font-sora ${
                                style === s 
                                  ? 'bg-blue-500 text-black shadow-md scale-105' 
                                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                              }`}
                              disabled={isLoading}
                              aria-label={`Select ${s} style`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button onClick={handleGenerateDirect} disabled={isLoading} className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold font-sora py-3 px-4 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-blue-500/30">
                      <SparklesIcon className="h-6 w-6 mr-2" />
                      Generate My Tattoo
                    </button>
                  </div>
                )}

                {mode === 'personalized' && (
                  <div className="space-y-4">
                      <h3 className="text-xl font-sora text-blue-300 text-center mb-4">Your Personalized Journey</h3>
                      {conversation.map((turn, index) => (
                        <FadeIn key={index} delay={index * 100} className="text-sm font-sora">
                          <p className="text-gray-300 mb-1 pl-2 border-l-2 border-sky-700"> <span className='font-bold text-sky-400'>Q:</span> {turn.q}</p>
                          <p className="text-gray-200 mb-3 pl-2 border-l-2 border-purple-700"><span className='font-bold text-purple-400'>A:</span> {turn.a}</p>
                        </FadeIn>
                      ))}

                      {aiSummary && (
                         <FadeIn className="text-sm p-3 bg-gray-900/50 rounded-lg border border-gray-700 font-sora">
                            <p className="font-semibold text-blue-400">InkOracle says:</p>
                            <p className="text-gray-300 italic">"<Typewriter text={aiSummary} speed={20} />"</p>
                        </FadeIn>
                      )}

                      {currentQuestion && !isLoading && (
                        <FadeIn delay={200}>
                          <label htmlFor="answer" className="block text-sm text-gray-300 mb-2 pl-2 border-l-2 border-sky-400 font-sora">
                            {currentQuestion}
                          </label>
                          <div className="relative">
                            <textarea id="answer" rows={2} className="w-full bg-white/90 border-transparent rounded-lg p-3 pr-12 text-black focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all placeholder-gray-600 font-sora" placeholder="Your thoughts and feelings..." value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} disabled={isLoading} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAnswer(); } }} />
                             <button onClick={handleSendAnswer} disabled={isLoading || !currentAnswer.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white disabled:bg-gray-600 disabled:cursor-not-allowed transform transition-transform hover:scale-110">
                                <SendIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </FadeIn>
                      )}
                    </div>
                )}

                {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
              </div>
            </FadeIn>

            <div className="mt-12 w-full max-w-6xl mx-auto">
              {isLoading && !generatedConcept && <LoadingSpinner />}
              {generatedConcept && (
                <ResultCard
                  concept={generatedConcept}
                  onSave={handleSaveIdea}
                  isSaved={!!generatedConcept && savedIdeas.some(idea => idea && idea.id === generatedConcept.id)}
                  onImageRefined={handleImageRefined}
                />
              )}
            </div>
            
            <SavedIdeas 
              savedIdeas={savedIdeas} 
              onRemove={handleRemoveSavedIdea}
              onSelect={handleSelectSavedIdea}
            />
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
