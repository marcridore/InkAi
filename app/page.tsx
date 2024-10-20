// pages/index.tsx

"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StoryPromptInput from '@/components/StoryPromptInput';
import LanguageSelector from '@/components/LanguageSelector';
import EditingPanel from '@/components/EditingPanel';
import FormatSelector from '@/components/FormatSelector';
import FinalBookPreview from '@/components/FinalBookPreview';
import dynamic from 'next/dynamic';
import ComicPreview from '@/components/ComicPreview';
import SlideshowPreview from '@/components/SlideshowPreview';
import { LanguageVersion, PageContent, ComicPage, Block } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import EditableBookPreview from '@/components/EditableBookPreview';
import { saveAs } from 'file-saver';
import Image from 'next/image';
import TranslationManager from '@/components/TranslationManager';
import PreviewSelector from '@/components/PreviewSelector';
import { toast } from 'react-hot-toast';
import { Globe } from 'lucide-react';
import { createHash } from 'crypto';
import { useTranslation } from '@/hooks/useTranslation';
import { generateText } from '@/lib/together';
import { generatePDF, generateDOCX, downloadEPUB } from '@/lib/helpers';
import TranslationProgressIndicator from '@/components/TranslationProgressIndicator';
import { Button } from '@/components/ui/button'; // Add this import

// Use dynamic import for MagazinePreview
const MagazinePreview = dynamic(() => import('@/components/MagazinePreview'), { ssr: false });

type SizeType = {
  width: number;
  height: number;
};

export default function Home() {
  const [userAPIKey, setUserAPIKey] = useState('');
  const [iterativeMode, setIterativeMode] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [hasStartedStory, setHasStartedStory] = useState(false);
  const [imageCount, setImageCount] = useState(1);
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [activeLanguage, setActiveLanguage] = useState<string>('English');
  const [activePreview, setActivePreview] = useState<string>('book');
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['English']);
  const availableLanguages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Chinese (Simplified)',
    'Japanese',
    'Korean',
    'Arabic',
    'Hindi',
    'Dutch',
    'Swedish',
    'Polish',
    'Turkish',
    'Greek',
    'Hebrew',
    'Thai',
    'Vietnamese'
  ];
  const [pendingTranslations, setPendingTranslations] = useState<{[key: string]: boolean}>({});
  const translationCache = useRef<{[key: string]: {[key: string]: string}}>({});
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [contentHashes, setContentHashes] = useState<{ [key: string]: string }>({});
  const defaultLanguage = 'English';

  const {
    languageVersions,
    setLanguageVersions,
    isTranslating,
    translationProgress,
    translateAllContent,
    addNewContent,
  } = useTranslation([{ language: defaultLanguage, pages: [] }], defaultLanguage);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const addLanguage = (language: string) => {
    if (!languages.includes(language)) {
      setLanguages([...languages, language]);
      setLanguageVersions([...languageVersions, { language, pages: [] }]);
    }
  };

  const removeLanguage = (language: string) => {
    if (languages.length > 1) {
      setLanguages(languages.filter((l) => l !== language));
      setLanguageVersions(languageVersions.filter((v) => v.language !== language));
      if (activeLanguage === language) {
        setActiveLanguage(languages[0]);
      }
    }
  };

  const addNewPage = () => {
    setLanguageVersions((prevVersions) =>
      prevVersions.map((version) => ({
        ...version,
        pages: [
          ...version.pages,
          { blocks: [{ type: 'text', content: '', generating: false, context: storyPrompt }] },
        ],
      }))
    );
  };

  const startStory = () => {
    if (storyPrompt.trim() === '') {
      alert('Please enter an initial story prompt.');
      return;
    }
    setHasStartedStory(true);
    addNewPage();
  };

  const updatePageContent = async (language: string, pageIndex: number, newContent: PageContent) => {
    setLanguageVersions((prevVersions) => {
      const updatedVersions = [...prevVersions];
      const versionIndex = updatedVersions.findIndex((v) => v.language === language);
      
      if (versionIndex !== -1) {
        updatedVersions[versionIndex].pages[pageIndex] = newContent;
      }

      return updatedVersions;
    });
  };

  const hashContent = (content: string): string => {
    return createHash('md5').update(content).digest('hex');
  };

  const handleTranslateAllContent = () => {
    console.log("Translate All Content button clicked");
    translateAllContent('English', targetLanguages.filter(lang => lang !== 'English'));
  };

  // Function to convert pages to comic format
  const convertToComicFormat = (pages: PageContent[]): ComicPage[] => {
    return pages.map((page) => ({
      panels: page.blocks.map((block) => ({
        type: block.type as 'image' | 'text',
        content:
          block.type === 'image' && block.content
            ? `data:image/png;base64,${block.content.b64_json}`
            : block.type === 'text'
            ? block.content
            : '',
        size: Math.random() > 0.7 ? 'large' : 'medium', // Randomly assign sizes for variety
        speechBubble: block.type === 'text' && Math.random() > 0.5, // Randomly make some text blocks speech bubbles
      })),
    }));
  };

  const handleTranslationComplete = (translations: LanguageVersion[]) => {
    setLanguageVersions((prevVersions) => {
      const updatedVersions = [...prevVersions];
      translations.forEach((translation) => {
        const existingIndex = updatedVersions.findIndex((v) => v.language === translation.language);
        if (existingIndex !== -1) {
          updatedVersions[existingIndex] = translation;
        } else {
          updatedVersions.push(translation);
        }
      });
      return updatedVersions;
    });
  };

  const handleShowTranslationOptions = () => {
    setShowLanguageSelector(true);
  };

  const handleDismissLanguageSelector = () => {
    setShowLanguageSelector(false);
  };

  const generateContent = async (pageIndex: number, selectedText: string) => {
    const currentVersion = languageVersions.find(v => v.language === defaultLanguage);
    if (!currentVersion) return '';

    const previousContent = currentVersion.pages
      .slice(0, pageIndex + 1)
      .flatMap(page => page.blocks)
      .filter(block => block.type === 'text')
      .map(block => block.content)
      .join('\n');

    const newContent = await generateText(selectedText, storyPrompt, previousContent, defaultLanguage);
    return newContent;
  };

  const downloadBook = async (format: 'pdf' | 'docx' | 'epub') => {
    try {
      setIsGeneratingDocx(true);
      const currentVersion = languageVersions.find((v) => v.language === activeLanguage);
      const pages = currentVersion ? currentVersion.pages : [];
  
      let fileBlob: Blob | null = null;
  
      switch (format) {
        case 'pdf':
          fileBlob = generatePDF(pages, activeLanguage);
          break;
        case 'docx':
          fileBlob = await generateDOCX(pages, activeLanguage);
          break;
        case 'epub':
          fileBlob = await downloadEPUB(pages, activeLanguage);
          break;
      }
  
      if (fileBlob) {
        saveAs(fileBlob, `storybook_${activeLanguage}.${format}`);
        toast.success(`${format.toUpperCase()} downloaded successfully!`);
      } else {
        throw new Error('Failed to generate file.');
      }
    } catch (error) {
      console.error(`Error generating ${format.toUpperCase()}:`, error);
      toast.error(`Failed to generate ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-200">
      <Header userAPIKey={userAPIKey} setUserAPIKey={setUserAPIKey} />

      {!hasStartedStory ? (
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-indigo-900 mb-4">
              Transform Your Ideas into Captivating Stories
            </h1>
            <p className="text-xl text-indigo-700 mb-8">
              Harness the power of AI to create, edit, and publish your stories in minutes, not months!
            </p>
            <StoryPromptInput
              storyPrompt={storyPrompt}
              setStoryPrompt={setStoryPrompt}
              startStory={startStory}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              icon="🌍"
              title="Global Reach"
              description="Instantly translate your stories into multiple languages, expanding your audience worldwide"
            />
            <FeatureCard
              icon="📚"
              title="Multi-Format Export"
              description="Publish your stories as books, comics, magazines, or slideshows with a single click"
            />
            <FeatureCard
              icon="🚀"
              title="10x Faster Creation"
              description="Generate complete, high-quality stories in minutes with our advanced AI technology"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-center text-indigo-900 mb-8">
              Your Journey to Bestseller Status
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <StepCard
                number="1"
                title="Spark Your Imagination"
                description="Enter a brief prompt or idea to kickstart your story"
              />
              <StepCard
                number="2"
                title="AI-Powered Creation"
                description="Watch as our AI crafts a unique, engaging narrative based on your input"
              />
              <StepCard
                number="3"
                title="Polish and Publish"
                description="Refine your story with our intuitive editor and export in your preferred format"
              />
            </div>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-indigo-900 mb-4">
              Join Thousands of Satisfied Storytellers
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              <Testimonial
                quote="This tool has revolutionized my writing process. I've published three books in the time it used to take me to write one!"
                author="Sarah J., Bestselling Author"
              />
              <Testimonial
                quote="The multi-language support helped me reach readers in 5 new countries. My audience has grown exponentially!"
                author="Michael L., International Content Creator"
              />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-indigo-900 mb-4">
              Ready to Write Your Masterpiece?
            </h2>
            <p className="text-xl text-indigo-700 mb-8">
              Join today and turn your ideas into captivating stories in minutes!
            </p>
            <button
              onClick={() => document.querySelector('textarea')?.focus()}
              className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full text-xl hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105"
            >
              Start Writing Now
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="container mx-auto px-4 py-8">
            {!showLanguageSelector && (
              <Button
                onClick={handleShowTranslationOptions}
                className="mb-4 bg-indigo-600 hover:bg-green-600 text-white flex items-center transition-colors duration-300"
              >
                <Globe className="mr-2" size={20} />
                Translate to Other Languages
              </Button>
            )}
            
            {showLanguageSelector && (
              <LanguageSelector
                availableLanguages={availableLanguages}
                targetLanguages={targetLanguages}
                setTargetLanguages={setTargetLanguages}
                onDismiss={handleDismissLanguageSelector}
              />
            )}
            
            {showLanguageSelector && (
              <Button
                onClick={handleTranslateAllContent}
                className="mb-4 bg-indigo-600 hover:bg-green-600 text-white transition-colors duration-300"
                disabled={isTranslating}
              >
                {isTranslating ? 'Translating...' : 'Translate All Content'}
              </Button>
            )}
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Editing Panel */}
              <div className="lg:w-1/2">
                <EditingPanel
                  languageVersions={languageVersions}
                  activeLanguage={activeLanguage}
                  setActiveLanguage={setActiveLanguage}
                  defaultLanguage={defaultLanguage}
                  addNewPage={addNewPage}
                  imageCount={imageCount}
                  setImageCount={setImageCount}
                  updatePageContent={updatePageContent}
                  setLanguageVersions={setLanguageVersions}
                  userAPIKey={userAPIKey}
                  iterativeMode={iterativeMode}
                  isGeneratingDocx={isGeneratingDocx}
                  storyPrompt={storyPrompt}
                  generateContent={generateContent}     
                />
              </div>

              {/* Preview Panel */}
              <div className="lg:w-1/2">
                <PreviewSelector
                  activePreview={activePreview}
                  setActivePreview={setActivePreview}
                  activeLanguage={activeLanguage}
                  setActiveLanguage={setActiveLanguage}
                  availableLanguages={targetLanguages}
                />
                {activePreview === 'book' && (
                  <FinalBookPreview
                    pages={languageVersions.find((v) => v.language === activeLanguage)?.pages || []}
                    language={activeLanguage}
                  />
                )}
                {activePreview === 'magazine' && (
                  <MagazinePreview
                    pages={languageVersions.find((v) => v.language === activeLanguage)?.pages || []}
                    language={activeLanguage}
                    updatePageContent={(pageIndex, newPage) => 
                      updatePageContent(activeLanguage, pageIndex, newPage)
                    }
                  />
                )}
                {activePreview === 'comic' && (
                  <ComicPreview
                    pages={convertToComicFormat(languageVersions.find((v) => v.language === activeLanguage)?.pages || [])}
                  />
                )}
                {activePreview === 'editablebook' && (
                  <EditableBookPreview
                    pages={languageVersions.find((v) => v.language === activeLanguage)?.pages || []}
                    language={activeLanguage}
                    updatePageContent={(pageIndex, newPage) => 
                      updatePageContent(activeLanguage, pageIndex, newPage)
                    }
                    availableLanguages={availableLanguages}
                  />
                )}
                {activePreview === 'slideshow' && (
                  <SlideshowPreview
                    pages={languageVersions.find((v) => v.language === activeLanguage)?.pages || []}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <Footer downloadBook={downloadBook} isGeneratingDocx={isGeneratingDocx} />
      <TranslationProgressIndicator progress={translationProgress} isTranslating={isTranslating} />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-indigo-900 mb-2">{title}</h3>
      <p className="text-indigo-700">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center mb-8 md:mb-0">
      <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-indigo-900 mb-2">{title}</h3>
      <p className="text-indigo-700 text-center">{description}</p>
    </div>
  );
}

function Testimonial({ quote, author }: { quote: string; author: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
      <p className="text-indigo-700 italic mb-4">"{quote}"</p>
      <p className="text-indigo-900 font-semibold">{author}</p>
    </div>
  );
}

