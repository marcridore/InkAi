import { jsPDF } from 'jspdf';

import { saveAs } from 'file-saver';
import { PageContent, Block } from '@/types';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx' ;
export const generatePDF = (pages: PageContent[], language: string): Blob => {
    const pdf = new jsPDF();
  
    pages.forEach((page, pageIndex) => {
      if (pageIndex > 0) {
        pdf.addPage();
      }
      let yOffset = 20;
  
      page.blocks.forEach((block) => {
        if (block.type === 'text') {
          const text = stripHtmlTags(block.content as string);
          pdf.setFontSize(12);
          const splitText = pdf.splitTextToSize(text, 170);
          pdf.text(splitText, 20, yOffset);
          yOffset += splitText.length * 7;
        } else if (
          block.type === 'image' &&
          block.content &&
          typeof block.content === 'object' &&
          'b64_json' in block.content
        ) {
          pdf.addImage(
            `data:image/png;base64,${block.content.b64_json}`,
            'PNG',
            20,
            yOffset,
            170,
            100
          );
          yOffset += 110;
        }
  
        if (yOffset > 280) {
          pdf.addPage();
          yOffset = 20;
        }
      });
    });
  
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  };


  export const generateDOCX = async (
    pages: PageContent[],
    activeLanguage: string,
  ): Promise<Blob> => {
    try {
      // Collect all sections in an array
      const sections = [];
  
      // Add title section
      sections.push({
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Storybook ${activeLanguage}`, bold: true, size: 24 })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      });
  
      for (const page of pages) {
        const pageChildren = [];
  
        for (const block of page.blocks) {
          if (block.type === 'text') {
            pageChildren.push(
              new Paragraph({
                children: [new TextRun(stripHtmlTags(block.content as string))],
              }),
            );
          } else if (block.type === 'image' && block.content) {
            try {
              let base64Data = (block.content as any).b64_json;
  
              // Determine the image type
              let imageType: 'jpg' | 'png' | 'gif' | 'bmp' = 'png'; // default
              const dataUrlMatch = base64Data.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,/i);
              if (dataUrlMatch && dataUrlMatch[1]) {
                const matchedType = dataUrlMatch[1].toLowerCase();
                if (matchedType === 'jpeg') {
                  imageType = 'jpg';
                } else if (
                  matchedType === 'jpg' ||
                  matchedType === 'png' ||
                  matchedType === 'gif' ||
                  matchedType === 'bmp'
                ) {
                  imageType = matchedType as 'jpg' | 'png' | 'gif' | 'bmp';
                }
                // Remove the Data URL prefix
                base64Data = base64Data.replace(
                  /^data:image\/(png|jpeg|jpg|gif|bmp);base64,/i,
                  '',
                );
              } else {
                // If no Data URL prefix, you might need to set imageType based on your data
                imageType = 'png'; // or determine the type from your data source
              }
  
              const imageBuffer = Buffer.from(base64Data, 'base64');
  
              pageChildren.push(
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: imageBuffer,
                      type: imageType,
                      transformation: {
                        width: 100,
                        height: 100,
                      },
                      floating: {
                        horizontalPosition: {
                          offset: 1014400, // 1 inch
                        },
                        verticalPosition: {
                          offset: 1014400, // 1 inch
                        },
                      },
                      altText: {
                        name: 'Image Name',
                        title: 'Image Title',
                        description: 'Image Description',
                      },
                    }),
                  ],
                }),
              );
            } catch (imageError) {
              console.error('Error adding image:', imageError);
              pageChildren.push(
                new Paragraph({
                  children: [new TextRun('Error: Unable to add image')],
                }),
              );
            }
          }
        }
  
        // Add the page as a new section
        sections.push({
          properties: {},
          children: pageChildren,
        });
      }
  
      // Create the document with all sections
      const doc = new Document({
        sections: sections,
      });
  
      const buffer = await Packer.toBlob(doc);
      return buffer; // Return the Blob instead of calling saveAs
    } catch (error) {
      console.error('Error generating DOCX:', error);
      throw error; // Rethrow the error to be handled in the caller
    }
  };
  export const downloadEPUB = async (pages: PageContent[], language: string): Promise<Blob> => {
    try {
      const response = await fetch('/api/generate-epub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pages,
          title: `Storybook ${language}`,
          language,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to generate EPUB');
      }
  
      const blob = await response.blob();
      return blob; // Return the Blob instead of calling saveAs
    } catch (error) {
      console.error('Error downloading EPUB:', error);
      throw error;
    }
  };

const stripHtmlTags = (html: string) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};