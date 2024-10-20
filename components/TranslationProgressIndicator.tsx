import React from 'react';

interface TranslationProgressIndicatorProps {
  progress: number;
  isTranslating: boolean;
}

const TranslationProgressIndicator: React.FC<TranslationProgressIndicatorProps> = ({ progress, isTranslating }) => {
  if (!isTranslating) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Translation Progress</h3>
      <div className="w-64 h-2 bg-gray-200 rounded-full">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm text-gray-600">{progress.toFixed(0)}% Complete</p>
    </div>
  );
};

export default TranslationProgressIndicator;
