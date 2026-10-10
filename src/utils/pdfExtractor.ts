/**
 * In-browser & Node-compatible PDF Text Extraction Utility
 * Powered by pdfjs-dist with support for FlateDecode compressed streams,
 * reading order preservation, and strict error classification.
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure worker in browser environment if available
if (typeof window !== 'undefined') {
  try {
    // In Vite, pdf.worker.min.mjs or pdf.worker.mjs can be referenced via URL
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    // Fallback: pdf.js legacy build runs cleanly with inline worker if workerSrc is unset
  }
}

export interface ExtractedPdfResult {
  fileName: string;
  fileSize: number;
  pageCount: number;
  extractedText: string;
  charCount: number;
  isScannedOrEmpty: boolean;
  warning?: string;
  error?: string;
}

export interface ExtractionOptions {
  maxFileSizeMB?: number;
  maxCharacters?: number;
  maxPages?: number;
}

const DEFAULT_OPTIONS: Required<ExtractionOptions> = {
  maxFileSizeMB: 30, // 30 MB file size limit
  maxCharacters: 50000, // 50,000 characters limit
  maxPages: 150, // 150 pages limit
};

/**
 * Extracts plain text from a File or ArrayBuffer/Uint8Array using pdfjs-dist.
 * Reconstructs reading order by sorting text items by vertical and horizontal coordinates.
 */
export async function extractTextFromPdf(
  input: File | ArrayBuffer | Uint8Array,
  fileName: string = 'document.pdf',
  fileSize: number = 0,
  options: ExtractionOptions = {}
): Promise<ExtractedPdfResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. Determine buffer and validate file size
  let uint8Data: Uint8Array;
  let effectiveSize = fileSize;

  if (typeof File !== 'undefined' && input instanceof File) {
    effectiveSize = input.size;
    fileName = input.name;

    if (effectiveSize > opts.maxFileSizeMB * 1024 * 1024) {
      return {
        fileName,
        fileSize: effectiveSize,
        pageCount: 0,
        extractedText: '',
        charCount: 0,
        isScannedOrEmpty: false,
        error: `File size exceeds the ${opts.maxFileSizeMB}MB limit (${(effectiveSize / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller PDF or copy and paste the relevant excerpts directly.`,
      };
    }

    const arrayBuffer = await input.arrayBuffer();
    uint8Data = new Uint8Array(arrayBuffer);
  } else if (input instanceof Uint8Array) {
    uint8Data = input;
    if (effectiveSize === 0) effectiveSize = input.byteLength;
  } else if (input instanceof ArrayBuffer) {
    uint8Data = new Uint8Array(input);
    if (effectiveSize === 0) effectiveSize = input.byteLength;
  } else {
    return {
      fileName,
      fileSize: 0,
      pageCount: 0,
      extractedText: '',
      charCount: 0,
      isScannedOrEmpty: false,
      error: 'Invalid input provided. Expected a File or ArrayBuffer.',
    };
  }

  // File size validation across all input types
  if (effectiveSize > opts.maxFileSizeMB * 1024 * 1024) {
    return {
      fileName,
      fileSize: effectiveSize,
      pageCount: 0,
      extractedText: '',
      charCount: 0,
      isScannedOrEmpty: false,
      error: `File size exceeds the ${opts.maxFileSizeMB}MB limit (${(effectiveSize / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller PDF or copy and paste the relevant excerpts directly.`,
    };
  }

  // 2. Validate basic PDF magic header (%PDF-)
  if (uint8Data.length < 5) {
    return {
      fileName,
      fileSize: effectiveSize,
      pageCount: 0,
      extractedText: '',
      charCount: 0,
      isScannedOrEmpty: false,
      error: 'The uploaded file is empty or corrupted (missing PDF header).',
    };
  }

  const header = String.fromCharCode(...uint8Data.slice(0, 5));
  if (header !== '%PDF-') {
    return {
      fileName,
      fileSize: effectiveSize,
      pageCount: 0,
      extractedText: '',
      charCount: 0,
      isScannedOrEmpty: false,
      error: 'The uploaded file is not a valid PDF document (missing %PDF- header).',
    };
  }

  // 3. Load PDF Document via pdfjs-dist
  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      useSystemFonts: true,
      stopAtErrors: false,
    });
    pdfDoc = await loadingTask.promise;
  } catch (err: any) {
    const errName = err?.name || '';
    const errMsg = err?.message || '';

    if (errName === 'PasswordException' || errMsg.toLowerCase().includes('password')) {
      return {
        fileName,
        fileSize: effectiveSize,
        pageCount: 0,
        extractedText: '',
        charCount: 0,
        isScannedOrEmpty: false,
        error: 'This PDF is encrypted or password-protected. Please remove the password or paste your notes directly.',
      };
    }

    if (errName === 'InvalidPDFException' || errMsg.toLowerCase().includes('invalid pdf')) {
      return {
        fileName,
        fileSize: effectiveSize,
        pageCount: 0,
        extractedText: '',
        charCount: 0,
        isScannedOrEmpty: false,
        error: 'The PDF structure is damaged or unreadable. Please check the source file or export it again.',
      };
    }

    return {
      fileName,
      fileSize: effectiveSize,
      pageCount: 0,
      extractedText: '',
      charCount: 0,
      isScannedOrEmpty: false,
      error: `Could not parse PDF: ${errMsg || 'Unexpected document structure'}`,
    };
  }

  const pageCount = pdfDoc.numPages;
  if (pageCount === 0) {
    return {
      fileName,
      fileSize: effectiveSize,
      pageCount: 0,
      extractedText: '',
      charCount: 0,
      isScannedOrEmpty: true,
      warning: 'The document contains 0 pages.',
    };
  }

  // 4. Extract text page by page preserving reading order
  const pagesToProcess = Math.min(pageCount, opts.maxPages);
  const pageTexts: string[] = [];
  let totalExtractedLength = 0;
  let wasTruncated = false;

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items as Array<{
        str: string;
        transform: number[];
        width: number;
        height: number;
        hasEOL?: boolean;
      }>;

      if (!items || items.length === 0) {
        continue;
      }

      // Sort items by reading order:
      // In PDF coordinates: Y increases upwards. Top of page has high Y, bottom has low Y.
      // 1. Group/sort by Y descending (top to bottom) with vertical line tolerance
      // 2. Sort by X ascending (left to right)
      const lineTolerance = 4; // points
      const sortedItems = [...items].sort((a, b) => {
        const yA = a.transform[5] || 0;
        const yB = b.transform[5] || 0;
        const diffY = yB - yA;

        if (Math.abs(diffY) > lineTolerance) {
          return diffY; // Top to bottom
        }

        // On the same horizontal line: left to right
        const xA = a.transform[4] || 0;
        const xB = b.transform[4] || 0;
        return xA - xB;
      });

      // Assemble line text
      let pageString = '';
      let lastY: number | null = null;
      let lastXEnd = 0;

      for (const item of sortedItems) {
        const text = item.str;
        if (!text && !item.hasEOL) continue;

        const currentY = item.transform[5] || 0;
        const currentX = item.transform[4] || 0;

        if (lastY === null) {
          pageString += text;
        } else {
          const yDiff = Math.abs(lastY - currentY);
          if (yDiff > lineTolerance) {
            // New line or paragraph break
            const isParagraph = yDiff > 14;
            pageString += isParagraph ? '\n\n' + text : '\n' + text;
          } else {
            // Same line: add space if separated and neither already has whitespace
            const spaceNeeded = currentX - lastXEnd > 2 && !pageString.endsWith(' ') && !text.startsWith(' ');
            pageString += (spaceNeeded ? ' ' : '') + text;
          }
        }

        lastY = currentY;
        lastXEnd = currentX + (item.width || 0);

        if (item.hasEOL && !pageString.endsWith('\n')) {
          pageString += '\n';
        }
      }

      const trimmedPage = pageString.trim();
      if (trimmedPage) {
        pageTexts.push(trimmedPage);
        totalExtractedLength += trimmedPage.length;
      }

      if (totalExtractedLength >= opts.maxCharacters) {
        wasTruncated = true;
        break;
      }
    } catch (pageErr) {
      console.warn(`Warning: failed to extract text from page ${pageNum}:`, pageErr);
    }
  }

  let finalExtractedText = pageTexts.join('\n\n---\n\n').trim();

  if (finalExtractedText.length > opts.maxCharacters) {
    finalExtractedText = finalExtractedText.slice(0, opts.maxCharacters);
    wasTruncated = true;
  }

  // 5. Evaluate extraction result & formulate clear diagnostic notice
  const charCount = finalExtractedText.length;
  const isScannedOrEmpty = charCount < 25;

  let warning: string | undefined;

  if (isScannedOrEmpty) {
    warning = `No extractable text was found in this document (${pageCount} page${pageCount > 1 ? 's' : ''}). This typically occurs when a PDF contains scanned images or photos of pages without an OCR text layer. You can paste your text or lecture notes directly in the "Paste Text" tab.`;
  } else if (wasTruncated) {
    warning = `Document exceeds the character threshold. Extracted the first ${opts.maxCharacters.toLocaleString()} characters (~${Math.round(opts.maxCharacters / 5).toLocaleString()} words) across ${pagesToProcess} pages to optimize AI assessment synthesis.`;
  } else if (pageCount > opts.maxPages) {
    warning = `Processed the first ${opts.maxPages} pages of ${pageCount} total pages.`;
  }

  return {
    fileName,
    fileSize: effectiveSize,
    pageCount,
    extractedText: finalExtractedText,
    charCount,
    isScannedOrEmpty,
    warning,
  };
}

/**
 * Backward-compatible helper for File upload inputs
 */
export async function extractTextFromPdfFile(file: File): Promise<ExtractedPdfResult> {
  return extractTextFromPdf(file, file.name, file.size);
}
