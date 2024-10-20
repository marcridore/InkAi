import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react'; // Import the X icon

interface LanguageSelectorProps {
  availableLanguages: string[];
  targetLanguages: string[];
  setTargetLanguages: (languages: string[]) => void;
  onDismiss: () => void; // Add this prop
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  availableLanguages,
  targetLanguages,
  setTargetLanguages,
  onDismiss, // Add this prop
}) => {
  const handleLanguageToggle = (language: string) => {
    if (targetLanguages.includes(language)) {
      setTargetLanguages(targetLanguages.filter(lang => lang !== language));
    } else {
      setTargetLanguages([...targetLanguages, language]);
    }
  };

  return (
    <div className="mb-4 p-6 bg-white rounded-lg shadow-lg border border-gray-200 relative">
      <Button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 bg-green-500 hover:bg-green-600 text-white"
        variant="ghost"
      >
        <X size={20} />
      </Button>
      <h3 className="text-xl font-bold mb-4 text-black">Select Target Languages</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {availableLanguages.map((lang) => (
          <label key={lang} className="flex items-center space-x-3 cursor-pointer bg-gray-100 p-2 rounded-md hover:bg-gray-200 transition-colors duration-200">
            <Checkbox
              checked={targetLanguages.includes(lang)}
              onCheckedChange={() => handleLanguageToggle(lang)}
              className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-black font-medium">{lang}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
