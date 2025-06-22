'use client';

import { useState, useRef, useEffect } from 'react';
import { SignatureEditor } from '@/components/SignatureEditor';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { cn } from '@/lib/utils';
import { Rnd } from 'react-rnd';
import { trackFileUpload, trackSignatureCreation, trackTextAddition, trackDocumentDownload } from '@/lib/analytics';

// Set worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface SignatureField {
  id: string;
  type: 'signature' | 'text';
  position: { x: number; y: number };
  content: string;
  page?: number;
  width: number;
  height: number;
  maintainAspectRatio?: boolean;
  textOptions?: {
    fontSize: number;
    color: string;
    fontFamily: string;
  };
}

interface TextLayer {
  id: string;
  content: string;
  position: { x: number; y: number };
  page: number;
  fontSize: number;
}

// Add this component before the Home component
const DraggableBox = ({ field, onUpdate, onDelete }: {
  field: SignatureField;
  onUpdate: (updatedField: SignatureField) => void;
  onDelete: () => void;
}) => {
  const [dimensions, setDimensions] = useState({ width: field.width, height: field.height });
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-adjust dimensions based on content
  useEffect(() => {
    if (contentRef.current) {
      const content = contentRef.current;
      const computedStyle = window.getComputedStyle(content);
      const newWidth = Math.max(300, content.scrollWidth + 40); // minimum width of 300px
      const newHeight = Math.max(100, content.scrollHeight + 40); // minimum height of 100px

      if (newWidth !== dimensions.width || newHeight !== dimensions.height) {
        setDimensions({ width: newWidth, height: newHeight });
        onUpdate({
          ...field,
          width: newWidth,
          height: newHeight
        });
      }
    }
  }, [field.content, field.textOptions?.fontSize, field.textOptions?.fontFamily]);

  return (
    <Rnd
      default={{
        x: field.position.x,
        y: field.position.y,
        width: dimensions.width,
        height: dimensions.height
      }}
      position={{ x: field.position.x, y: field.position.y }}
      size={{ width: dimensions.width, height: dimensions.height }}
      onDragStop={(e, d) => {
        onUpdate({
          ...field,
          position: { x: d.x, y: d.y }
        });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const newWidth = parseFloat(ref.style.width);
        const newHeight = parseFloat(ref.style.height);
        setDimensions({ width: newWidth, height: newHeight });
        onUpdate({
          ...field,
          width: newWidth,
          height: newHeight,
          position: { x: position.x, y: position.y }
        });
      }}
      bounds="parent"
      lockAspectRatio={field.maintainAspectRatio}
      minWidth={300}
      minHeight={100}
      className={cn(
        "draggable-container group",
        field.type === 'signature' ? 'cursor-move' : 'cursor-text'
      )}
      style={{
        position: 'absolute',
        touchAction: 'none',
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px dashed rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        transition: 'border 0.2s, background 0.2s',
        padding: '10px'
      }}
      resizeHandleStyles={{
        bottomRight: {
          position: 'absolute',
          width: '20px',
          height: '20px',
          background: 'transparent',
          right: '-10px',
          bottom: '-10px',
          cursor: 'se-resize',
          zIndex: 51
        }
      }}
      resizeHandleComponent={{
        bottomRight: (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-500 bg-white rounded-full shadow-lg p-1"
            >
              <path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8" />
            </svg>
          </div>
        )
      }}
    >
      <div 
        ref={contentRef}
        className="relative w-full h-full flex flex-col justify-center select-none group-hover:border-blue-400"
      >
        {field.type === 'signature' ? (
          <img
            src={field.content}
            alt="Signature"
            className="w-full h-full object-contain pointer-events-none"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            draggable={false}
          />
        ) : (
          <textarea
            value={field.content}
            onChange={(e) => onUpdate({ ...field, content: e.target.value })}
            style={{
              fontSize: `${field.textOptions?.fontSize || 16}px`,
              color: field.textOptions?.color || '#000000',
              fontFamily: field.textOptions?.fontFamily || 'Arial, sans-serif',
              width: '100%',
              height: '100%',
              resize: 'none',
              border: 'none',
              background: 'transparent',
              padding: '8px',
              outline: 'none'
            }}
            placeholder="Enter text here..."
          />
        )}
        <div className="absolute top-0 right-0 flex gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDelete}
            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
            title="Delete"
          >
            ×
          </button>
          {field.type === 'signature' && (
            <button
              onClick={() => {
                onUpdate({
                  ...field,
                  maintainAspectRatio: !field.maintainAspectRatio
                });
              }}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 shadow-lg"
              title={field.maintainAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {field.maintainAspectRatio ? "🔒" : "🔓"}
            </button>
          )}
        </div>
      </div>
    </Rnd>
  );
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageScale, setPageScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    const newUrl = URL.createObjectURL(selectedFile);
    setPdfUrl(newUrl);
    setCurrentPage(1);
    setFields([]);
    setTextLayers([]);

    // Get dimensions for image files
    if (selectedFile.type.startsWith('image/')) {
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          setPdfDimensions({
            width: img.naturalWidth,
            height: img.naturalHeight
          });
          resolve();
        };
        img.src = newUrl;
      });
    }

    if (selectedFile.type === 'application/pdf') {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      // Initialize text layers for each page
      const initialTextLayers: TextLayer[] = [];
      pages.forEach((_, index) => {
        initialTextLayers.push({
          id: `text-layer-${index + 1}`,
          content: '',
          position: { x: 0, y: 0 },
          page: index + 1,
          fontSize: 12
        });
      });
      setTextLayers(initialTextLayers);
    }

    trackFileUpload(selectedFile.type, selectedFile.size);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Get PDF dimensions after load
    if (pageRef.current) {
      const element = pageRef.current.querySelector('.react-pdf__Page') || pageRef.current.querySelector('img');
      if (element) {
        const dimensions = {
          width: element.clientWidth,
          height: element.clientHeight
        };
        console.log('Setting dimensions:', dimensions);
        setPdfDimensions(dimensions);
      }
    }
  };

  const handleSignatureSave = (signature: string) => {
    if (!pdfDimensions.width || !pdfDimensions.height) {
      console.error('PDF/Image dimensions not available');
      return;
    }

    const signatureWidth = Math.min(800, pdfDimensions.width * 0.8);
    const signatureHeight = 250;
    const padding = 40;

    const defaultX = Math.max(padding, (pdfDimensions.width - signatureWidth) / 2);
    const defaultY = Math.max(padding, (pdfDimensions.height - signatureHeight) / 2);

    const newField: SignatureField = {
      id: Date.now().toString(),
      type: 'signature',
      position: { x: defaultX, y: defaultY },
      content: signature,
      page: currentPage,
      width: signatureWidth,
      height: signatureHeight,
      maintainAspectRatio: true
    };

    setFields(prev => [...prev, newField]);
    setShowSignatureEditor(false);

    trackSignatureCreation('custom_signature');
  };

  const addTextBox = () => {
    if (!pdfDimensions.width || !pdfDimensions.height) {
      console.error('PDF/Image dimensions not available');
      return;
    }

    const textWidth = Math.min(200, pdfDimensions.width * 0.3);
    const textHeight = 100;

    const defaultX = Math.max(0, (pdfDimensions.width - textWidth) / 2);
    const defaultY = Math.max(0, (pdfDimensions.height - textHeight) / 2);

    const newField: SignatureField = {
      id: Date.now().toString(),
      type: 'text',
      position: { x: defaultX, y: defaultY },
      content: '',
      page: currentPage,
      width: textWidth,
      height: textHeight,
      textOptions: {
        fontSize: 16,
        color: '#000000',
        fontFamily: 'Arial, sans-serif'
      }
    };

    setFields(prev => [...prev, newField]);

    trackTextAddition();
  };

  const handleSaveDocument = async () => {
    if (!file) return;

    try {
      if (file.type.includes('pdf')) {
        console.log('Starting PDF processing...');
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        
        // Get the PDF viewer element and its dimensions
        const pdfViewer = pageRef.current?.querySelector('.react-pdf__Page');
        if (!pdfViewer) {
          throw new Error('Could not find PDF viewer element');
        }

        const viewerRect = pdfViewer.getBoundingClientRect();
        console.log('PDF Viewer dimensions:', {
          width: viewerRect.width,
          height: viewerRect.height
        });

        // Process each page
        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
          const pdfPage = pages[pageIndex];
          const { width: pageWidth, height: pageHeight } = pdfPage.getSize();
          
          console.log('PDF Page dimensions:', {
            width: pageWidth,
            height: pageHeight
          });

          // Calculate scale factors
          const scaleX = pageWidth / viewerRect.width;
          const scaleY = pageHeight / viewerRect.height;

          // Get all fields for this page
          const pageFields = fields.filter(field => !field.page || field.page === pageIndex + 1);

          // Process all fields for this page
          for (const field of pageFields) {
            try {
              if (field.type === 'signature') {
                const imageData = await fetch(field.content)
                  .then(response => response.arrayBuffer())
                  .catch((error) => {
                    console.error('Error fetching signature data:', error);
                    throw new Error(`Failed to load signature image for field ${field.id}`);
                  });

                const image = await pdfDoc.embedPng(imageData);
                
                // Get original image dimensions
                const { width: origWidth, height: origHeight } = image.size();
                
                // Calculate dimensions preserving the exact preview size
                const signatureWidth = Math.round(field.width * scaleX);
                const signatureHeight = Math.round(field.height * scaleY);
                
                // Calculate position to match preview exactly
                const signatureX = Math.round(field.position.x * scaleX);
                const signatureY = pageHeight - Math.round(field.position.y * scaleY) - signatureHeight;

                console.log('Drawing signature with dimensions:', {
                  width: signatureWidth,
                  height: signatureHeight,
                  x: signatureX,
                  y: signatureY,
                  scale: { scaleX, scaleY }
                });

                // Draw the signature with exact dimensions
                pdfPage.drawImage(image, {
                  x: signatureX,
                  y: signatureY,
                  width: signatureWidth,
                  height: signatureHeight,
                  opacity: 1
                });
              } else if (field.type === 'text') {
                // Handle text fields
                const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                const fontSize = (field.textOptions?.fontSize || 16) * scaleY;
                
                // Convert hex color to RGB
                const hexToRgb = (hex: string) => {
                  const r = parseInt(hex.slice(1, 3), 16) / 255;
                  const g = parseInt(hex.slice(3, 5), 16) / 255;
                  const b = parseInt(hex.slice(5, 7), 16) / 255;
                  return { r, g, b };
                };
                const textColor = hexToRgb(field.textOptions?.color || '#000000');

                const x = field.position.x * scaleX;
                const y = pageHeight - (field.position.y * scaleY) - (fontSize * 1.2);

                // Split text into words and handle text wrapping
                const words = field.content.split(' ');
                const maxWidth = field.width * scaleX;
                let currentLine = '';
                let yOffset = 0;

                for (const word of words) {
                  const testLine = currentLine ? `${currentLine} ${word}` : word;
                  const textWidth = font.widthOfTextAtSize(testLine, fontSize);

                  if (textWidth <= maxWidth) {
                    currentLine = testLine;
                  } else {
                    // Draw the current line and move to next line
                    pdfPage.drawText(currentLine, {
                      x,
                      y: y - yOffset,
                      size: fontSize,
                      font: font,
                      color: rgb(textColor.r, textColor.g, textColor.b)
                    });
                    yOffset += fontSize * 1.2; // Line spacing
                    currentLine = word;
                  }
                }

                // Draw the last line
                if (currentLine) {
                  pdfPage.drawText(currentLine, {
                    x,
                    y: y - yOffset,
                    size: fontSize,
                    font: font,
                    color: rgb(textColor.r, textColor.g, textColor.b)
                  });
                }
              }
            } catch (fieldError: any) {
              console.error(`Error processing field ${field.id}:`, fieldError);
              throw new Error(`Failed to process field on page ${pageIndex + 1}: ${fieldError?.message || 'Unknown error'}`);
            }
          }
        }

        // Save the PDF
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `signed-${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        trackDocumentDownload(file.name);
      } else if (file.type.startsWith('image/')) {
        console.log('Starting image processing...');
        
        // Create a new canvas with the original image dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Load the original image first
        const originalImg = new Image();
        await new Promise<void>((resolve, reject) => {
          originalImg.onload = () => {
            console.log('Original image loaded:', originalImg.naturalWidth, 'x', originalImg.naturalHeight);
            resolve();
          };
          originalImg.onerror = () => reject(new Error('Failed to load original image'));
          originalImg.src = pdfUrl;
        });

        // Set canvas size to match original image
        canvas.width = originalImg.naturalWidth;
        canvas.height = originalImg.naturalHeight;
        console.log('Canvas size set to:', canvas.width, 'x', canvas.height);

        // Enable high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw original image
        ctx.drawImage(originalImg, 0, 0);
        console.log('Original image drawn to canvas');

        // Get the displayed image element for scaling
        const displayedImage = pageRef.current?.querySelector('img');
        if (!displayedImage) {
          throw new Error('Could not find displayed image element');
        }

        // Calculate scale factors
        const scaleX = originalImg.naturalWidth / displayedImage.clientWidth;
        const scaleY = originalImg.naturalHeight / displayedImage.clientHeight;
        console.log('Scale factors:', scaleX, scaleY);

        // Draw all fields
        console.log('Processing fields:', fields.length);
        for (const field of fields) {
          try {
            if (field.type === 'signature') {
              // Draw signature
              const signatureImg = new Image();
              await new Promise<void>((resolve, reject) => {
                signatureImg.onload = () => {
                  console.log('Signature loaded:', field.id);
                  // Use exact preview dimensions
                  const width = Math.round(field.width * scaleX);
                  const height = Math.round(field.height * scaleY);
                  
                  // Match preview position exactly
                  const x = Math.round(field.position.x * scaleX);
                  const y = Math.round(field.position.y * scaleY);
                  
                  // Optimize rendering quality
                  ctx.imageSmoothingEnabled = false;
                  ctx.imageSmoothingQuality = 'high';
                  
                  // Draw with exact dimensions from preview
                  ctx.drawImage(signatureImg, x, y, width, height);
                  
                  // Reset canvas settings
                  ctx.imageSmoothingEnabled = true;
                  console.log('Signature drawn:', field.id);
                  resolve();
                };
                signatureImg.onerror = () => reject(new Error(`Failed to load signature ${field.id}`));
                signatureImg.src = field.content;
              });
            } else if (field.type === 'text') {
              // Draw text
              const fontSize = Math.round((field.textOptions?.fontSize || 16) * scaleY);
              ctx.font = `${fontSize}px ${field.textOptions?.fontFamily || 'Arial'}`;
              ctx.fillStyle = field.textOptions?.color || '#000000';
              ctx.textBaseline = 'top';

              const x = Math.round(field.position.x * scaleX);
              const y = Math.round(field.position.y * scaleY);
              
              // Handle text wrapping
              const maxWidth = Math.round(field.width * scaleX);
              const lineHeight = fontSize * 1.2;
              const words = field.content.split(' ');
              let line = '';
              let posY = y;

              for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth > maxWidth && n > 0) {
                  ctx.fillText(line, x, posY);
                  line = words[n] + ' ';
                  posY += lineHeight;
                } else {
                  line = testLine;
                }
              }
              ctx.fillText(line, x, posY);
            }
          } catch (error) {
            console.error('Error processing field:', error);
            throw error;
          }
        }

        // Convert to blob and download
        console.log('Creating final image...');
        try {
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (result) => {
                if (result) {
                  console.log('Blob created successfully:', result.size, 'bytes');
                  resolve(result);
                } else {
                  reject(new Error('Failed to create image blob'));
                }
              },
              file.type,
              1.0
            );
          });

          console.log('Downloading image...');
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `signed-${file.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('Download complete');

          trackDocumentDownload(file.name);
        } catch (error) {
          console.error('Error in final image creation:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert(error instanceof Error ? error.message : 'Error saving the document. Please try again.');
    }
  };

  // Add a new useEffect to handle image dimensions
  useEffect(() => {
    if (file?.type.startsWith('image/') && pageRef.current) {
      const img = pageRef.current.querySelector('img');
      if (img) {
        const updateDimensions = () => {
          const dimensions = {
            width: img.clientWidth,
            height: img.clientHeight
          };
          console.log('Updating image dimensions:', dimensions);
          setPdfDimensions(dimensions);
        };

        // Update dimensions when image loads
        img.addEventListener('load', updateDimensions);
        // Also update dimensions immediately if image is already loaded
        if (img.complete) {
          updateDimensions();
        }

        return () => {
          img.removeEventListener('load', updateDimensions);
        };
      }
    }
  }, [file]);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Digital Signature App</h1>
          <p className="text-gray-600">Add your signature to documents and images</p>
        </div>

        {/* File Upload Section */}
        {!file && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF or Image files</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>
        )}

        {/* Document Editor */}
        {file && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">Document Editor</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {numPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                    disabled={currentPage === numPages}
                    className="px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addTextBox}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Add Text
                </button>
                <button
                  onClick={() => setShowSignatureEditor(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                >
                  Add Signature
                </button>
                <button
                  onClick={handleSaveDocument}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Save Document
                </button>
              </div>
            </div>

            <div className="pdf-container relative" ref={pageRef}>
              <div className="pdf-page-container relative">
                {file.type.startsWith('image/') ? (
                  <div className="relative inline-block">
                    <img
                      src={pdfUrl}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: '80vh' }}
                    />
                    {/* Draggable Overlay for Images */}
                    <div className="absolute inset-0">
                      {fields
                        .filter(field => !field.page || field.page === currentPage)
                        .map((field) => (
                          <DraggableBox
                            key={field.id}
                            field={field}
                            onUpdate={(updatedField) => {
                              setFields(fields =>
                                fields.map(f => f.id === field.id ? updatedField : f)
                              );
                            }}
                            onDelete={() => {
                              setFields(fields => fields.filter(f => f.id !== field.id));
                            }}
                          />
                        ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative mx-auto" style={{ width: 'fit-content' }}>
                      <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                      >
                        <Page
                          pageNumber={currentPage}
                          scale={pageScale}
                          renderAnnotationLayer={true}
                          renderTextLayer={true}
                        />
                      </Document>
                      {/* Draggable Overlay for PDFs */}
                      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                        <div className="relative w-full h-full" style={{ pointerEvents: 'all' }}>
                          {fields
                            .filter(field => !field.page || field.page === currentPage)
                            .map((field) => (
                              <DraggableBox
                                key={field.id}
                                field={field}
                                onUpdate={(updatedField) => {
                                  setFields(fields =>
                                    fields.map(f => f.id === field.id ? updatedField : f)
                                  );
                                }}
                                onDelete={() => {
                                  setFields(fields => fields.filter(f => f.id !== field.id));
                                }}
                              />
                            ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Signature Editor Modal */}
        {showSignatureEditor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Add Your Signature</h3>
                <button
                  onClick={() => setShowSignatureEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SignatureEditor onSave={handleSignatureSave} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 