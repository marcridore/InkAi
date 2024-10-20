import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { ComicPage } from '@/types';
import { Button } from '@/components/ui/button';

type ComicPreviewProps = {
  pages: ComicPage[];
};

const ComicPreview: React.FC<ComicPreviewProps> = ({ pages }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fontColor, setFontColor] = useState('#000000');

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % pages.length);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + pages.length) % pages.length);
  };

  const renderPanel = (panel: ComicPage['panels'][number], index: number) => {
    const panelStyle: React.CSSProperties = {
      border: '2px solid black',
      padding: '10px',
      margin: '5px',
      gridColumn: panel.size === 'large' ? 'span 2' : 'span 1',
      gridRow: panel.size === 'large' ? 'span 2' : 'span 1',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: backgroundColor,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    };

    const contentStyle: React.CSSProperties = panel.speechBubble
      ? {
          background: 'white',
          border: '2px solid black',
          borderRadius: '20px',
          padding: '10px',
          maxWidth: '90%',
          fontFamily: 'Comic Sans MS, cursive',
          fontSize: '14px',
          position: 'relative',
          zIndex: 1,
          color: fontColor,
        }
      : {
          fontFamily: 'Comic Sans MS, cursive',
          fontSize: '14px',
          textAlign: 'center',
          padding: '10px',
          maxWidth: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '5px',
          color: fontColor,
        };

    return (
      <div key={index} style={panelStyle}>
        {panel.type === 'image' ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '200px' }}>
            {panel.content ? (
              <Image
                src={panel.content}
                alt={`Panel ${index}`}
                layout="fill"
                objectFit="cover"
              />
            ) : (
              <div>No image available</div>
            )}
          </div>
        ) : (
          <div style={contentStyle} dangerouslySetInnerHTML={{ __html: panel.content }} />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-100 p-6 rounded-lg shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Comic Preview</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <span className="mr-2">Background:</span>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-8 h-8 rounded"
            />
          </label>
          <label className="flex items-center">
            <span className="mr-2">Font:</span>
            <input
              type="color"
              value={fontColor}
              onChange={(e) => setFontColor(e.target.value)}
              className="w-8 h-8 rounded"
            />
          </label>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4" style={{ backgroundColor }}>
        <div className="grid grid-cols-2 gap-4">
          {pages[currentPage].panels.map(renderPanel)}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <Button onClick={prevPage} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous Page
        </Button>
        <span className="text-lg font-semibold">
          Page {currentPage + 1} of {pages.length}
        </span>
        <Button onClick={nextPage} variant="outline">
          Next Page
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      
      <div className="mt-4 bg-blue-100 p-3 rounded-lg flex items-center">
        <Info className="w-5 h-5 mr-2 text-blue-500" />
        <p className="text-sm text-blue-700">
          To add a new comic page, click "Add New Page" in the edit panel on the left.
        </p>
      </div>
    </div>
  );
};

export default ComicPreview;
