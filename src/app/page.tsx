'use client';

import { useState, useRef, useEffect } from 'react';
import { SignatureEditor } from '@/components/SignatureEditor';
import Draggable from 'react-draggable';
import { format } from 'date-fns';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { cn } from '@/lib/utils';
import { Rnd } from 'react-rnd';

// Set worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface SignatureField {
  id: string;
  type: 'signature' | 'date' | 'text' | 'textbox';
  position: { x: number; y: number };
  content: string;
  page?: number;
  size?: number;
  width: number;
  height: number;
  isEditing?: boolean;
  maintainAspectRatio?: boolean;
}

interface TextLayer {
  id: string;
  content: string;
  position: { x: number; y: number };
  page: number;
  fontSize: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageScale, setPageScale] = useState(1);
  const [editMode, setEditMode] = useState(false);
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
    setSignatureFields([]);
    setTextLayers([]);

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
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Get PDF dimensions after load
    if (pageRef.current) {
      const pdfElement = pageRef.current.querySelector('.react-pdf__Page');
      if (pdfElement) {
        setPdfDimensions({
          width: pdfElement.clientWidth,
          height: pdfElement.clientHeight
        });
      }
    }
  };

  const handleSignatureSave = (signature: string) => {
    if (!pdfDimensions.width || !pdfDimensions.height) return;

    // Calculate bottom right position with some padding
    const signatureWidth = 200;
    const signatureHeight = 100;
    const padding = 50;

    const defaultX = Math.max(0, pdfDimensions.width - signatureWidth - padding);
    const defaultY = Math.max(0, pdfDimensions.height - signatureHeight - padding);

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
    setSignatureFields([...signatureFields, newField]);
    setShowSignatureEditor(false);
  };

  const addTextBox = () => {
    if (!pdfDimensions.width || !pdfDimensions.height) return;

    // Calculate center position for text box
    const defaultX = Math.max(0, (pdfDimensions.width - 200) / 2);
    const defaultY = Math.max(0, (pdfDimensions.height - 100) / 2);

    const newField: SignatureField = {
      id: Date.now().toString(),
      type: 'textbox',
      position: { x: defaultX, y: defaultY },
      content: '',
      page: currentPage,
      width: 200,
      height: 100,
      isEditing: true
    };
    setSignatureFields([...signatureFields, newField]);
  };

  const handleTextLayerChange = (page: number, content: string) => {
    setTextLayers(layers =>
      layers.map(layer =>
        layer.page === page
          ? { ...layer, content }
          : layer
      )
    );
  };

  const handleDragStop = (id: string, e: any, data: { x: number; y: number }) => {
    setSignatureFields(fields =>
      fields.map(field =>
        field.id === id
          ? { ...field, position: { x: data.x, y: data.y } }
          : field
      )
    );
  };

  const handleSaveDocument = async () => {
    if (!file || !file.type.includes('pdf')) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Get PDF dimensions from the first page
      const firstPage = pages[0];
      const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();

      // Get the scale factor between screen and PDF coordinates
      const pageElement = pageRef.current?.querySelector('.react-pdf__Page');
      if (!pageElement) return;

      const screenWidth = pageElement.clientWidth;
      const screenHeight = pageElement.clientHeight;
      const scaleX = pdfWidth / screenWidth;
      const scaleY = pdfHeight / screenHeight;

      // Process each page
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const pdfPage = pages[pageIndex];
        
        // Get all fields for this page
        const pageFields = signatureFields.filter(field => field.page === pageIndex + 1);

        // Process all signatures and text boxes for this page
        for (const field of pageFields) {
          try {
            if (field.type === 'signature') {
              const response = await fetch(field.content);
              const imageData = await response.arrayBuffer();
              const image = await pdfDoc.embedPng(imageData);

              // Convert screen coordinates and dimensions to PDF coordinates
              const x = field.position.x * scaleX;
              const signatureWidth = field.width * scaleX;
              const signatureHeight = field.height * scaleY;
              
              // In PDF coordinates, y=0 is at the bottom, while in screen coordinates, y=0 is at the top
              const y = pdfHeight - (field.position.y * scaleY) - signatureHeight;

              pdfPage.drawImage(image, {
                x,
                y,
                width: signatureWidth,
                height: signatureHeight,
              });
            } else if (field.type === 'textbox') {
              const fontSize = 12 * scaleY;
              const x = field.position.x * scaleX;
              const y = pdfHeight - (field.position.y * scaleY);

              pdfPage.drawText(field.content, {
                x,
                y,
                size: fontSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
                maxWidth: 200 * scaleX,
              });
            }
          } catch (error) {
            console.error(`Error processing field ${field.id}:`, error);
          }
        }
      }

      // Save the PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'signed-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving the document. Please try again.');
    }
  };

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
                  onClick={() => setEditMode(!editMode)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg",
                    editMode
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {editMode ? 'Exit Edit Mode' : 'Edit Content'}
                </button>
                <button
                  onClick={() => setShowSignatureEditor(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                >
                  Add Signature
                </button>
                <button
                  onClick={addTextBox}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Add Text Box
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
              <div className="pdf-page-container">
                {file.type.startsWith('image/') ? (
                  <img
                    src={pdfUrl}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg"
                  />
                ) : (
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="mx-auto"
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={pageScale}
                      className="mx-auto"
                      renderAnnotationLayer={true}
                      renderTextLayer={true}
                    />
                  </Document>
                )}

                {/* Draggable Overlay */}
                <div className="draggable-overlay">
                  {signatureFields
                    .filter(field => !field.page || field.page === currentPage)
                    .map((field) => (
                      <Rnd
                        key={field.id}
                        default={{
                          x: field.position.x,
                          y: field.position.y,
                          width: field.width,
                          height: field.height
                        }}
                        position={{ x: field.position.x, y: field.position.y }}
                        size={{ width: field.width, height: field.height }}
                        onDragStop={(e, d) => {
                          setSignatureFields(fields =>
                            fields.map(f =>
                              f.id === field.id
                                ? { ...f, position: { x: d.x, y: d.y } }
                                : f
                            )
                          );
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                          setSignatureFields(fields =>
                            fields.map(f =>
                              f.id === field.id
                                ? {
                                    ...f,
                                    width: parseFloat(ref.style.width),
                                    height: parseFloat(ref.style.height),
                                    position: { x: position.x, y: position.y }
                                  }
                                : f
                            )
                          );
                        }}
                        lockAspectRatio={field.maintainAspectRatio}
                        bounds="parent"
                        minWidth={50}
                        minHeight={25}
                        enableResizing={{
                          top: true,
                          right: true,
                          bottom: true,
                          left: true,
                          topRight: true,
                          bottomRight: true,
                          bottomLeft: true,
                          topLeft: true
                        }}
                        resizeHandleComponent={{
                          bottomRight: <div className="resize-handle" />,
                          topLeft: <div className="resize-handle" />,
                          topRight: <div className="resize-handle" />,
                          bottomLeft: <div className="resize-handle" />
                        }}
                        className="signature-container"
                      >
                        <img
                          src={field.content}
                          alt="Signature"
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                        />
                        <div className="signature-controls">
                          <button
                            onClick={() => {
                              setSignatureFields(fields => fields.filter(f => f.id !== field.id));
                            }}
                            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                          <button
                            onClick={() => {
                              setSignatureFields(fields =>
                                fields.map(f =>
                                  f.id === field.id
                                    ? { ...f, maintainAspectRatio: !f.maintainAspectRatio }
                                    : f
                                )
                              );
                            }}
                            className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
                            title={field.maintainAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                          >
                            {field.maintainAspectRatio ? "🔒" : "🔓"}
                          </button>
                        </div>
                      </Rnd>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signature Editor Modal */}
        {showSignatureEditor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Add Your Signature</h3>
                <button
                  onClick={() => setShowSignatureEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <SignatureEditor onSave={handleSignatureSave} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 