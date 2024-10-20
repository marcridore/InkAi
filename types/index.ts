export type ImageResponse = {
    b64_json: string;
    timings?: { inference: number };
  };
  
  export type Block = 
    | { type: 'text'; content: string; generating?: boolean; context?: string; size?: 'small' | 'medium' | 'large'; column?: number; id?: string }
    | { type: 'image'; content: ImageResponse | null; generating?: boolean; prompt?: string; size?: 'small' | 'medium' | 'large'; column?: number; id?: string }
    | { type: 'video'; content: string; generating?: boolean; size?: 'small' | 'medium' | 'large'; column?: number; id?: string };
  
  export type ContentBlock = Block;
  
  export type PageContent = {
    blocks: Block[];
    columns?: number;
    backgroundImage?: string;
  };
  
  export type Page = PageContent;
  
  export interface PageProps {
    index: number;
    page: PageContent;
    setPageContent: (content: PageContent) => void;
    userAPIKey: string;
    iterativeMode: boolean;
    isGeneratingDocx: boolean;
    storyPrompt: string;
    imageCount: number;
    onDeletePage: () => void;
    onAddVideo: (videoUrl: string) => void;
    onContinueStory: (selectedText: string) => Promise<void>;
  }
  
  export type LanguageVersion = {
    language: string;
    pages: PageContent[];
  };
  
  export type ComicPage = {
    panels: {
      type: 'image' | 'text';
      content: string;
      size: 'small' | 'medium' | 'large';
      speechBubble: boolean;
    }[];
  };
  