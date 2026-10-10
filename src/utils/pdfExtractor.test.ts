/**
 * Test Suite for APTIQ PDF Text Extraction Engine
 * Tests uncompressed PDFs, compressed FlateDecode streams, reading order,
 * empty/scanned documents, and extraction error classifications.
 */

import zlib from 'zlib';
import { extractTextFromPdf } from './pdfExtractor';

function createPdfBuffer(streamContent: string, isCompressed: boolean = false): Uint8Array {
  let streamBytes: Buffer;
  let filterStr = '';

  if (isCompressed) {
    streamBytes = zlib.deflateSync(Buffer.from(streamContent, 'utf-8'));
    filterStr = '/Filter /FlateDecode ';
  } else {
    streamBytes = Buffer.from(streamContent, 'utf-8');
  }

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length ${streamBytes.length} ${filterStr}>>
stream
` + streamBytes.toString('binary') + `
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
450
%%EOF`;

  return new Uint8Array(Buffer.from(pdfString, 'binary'));
}

async function runTests() {
  console.log('--- Starting APTIQ PDF Text Extraction Audit Tests ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail: string = '') {
    if (condition) {
      console.log(`PASS: ${testName}`);
      passed++;
    } else {
      console.error(`FAIL: ${testName} - ${detail}`);
      failed++;
    }
  }

  // 1. Test Normal Uncompressed PDF
  try {
    const uncompressedStream = 'BT /F1 12 Tf 72 712 Td (Cognitive Architecture and Metacognition) Tj ET';
    const pdf = createPdfBuffer(uncompressedStream, false);
    const result = await extractTextFromPdf(pdf, 'uncompressed_lecture.pdf');

    assert(result.pageCount === 1, 'Uncompressed PDF page count is 1');
    assert(result.extractedText.includes('Cognitive Architecture and Metacognition'), 'Uncompressed PDF text matches');
    assert(result.isScannedOrEmpty === false, 'Uncompressed PDF is not marked scanned/empty');
    assert(!result.error, 'Uncompressed PDF has no errors');
  } catch (err: any) {
    assert(false, 'Uncompressed PDF test threw unexpected error', err.message);
  }

  // 2. Test FlateDecode Compressed PDF (The critical improvement!)
  try {
    const compressedStream = 'BT /F1 12 Tf 72 712 Td (Amdahls law governs the speedup of serial bottlenecks in distributed computing.) Tj ET';
    const pdf = createPdfBuffer(compressedStream, true);
    const result = await extractTextFromPdf(pdf, 'compressed_syllabus.pdf');

    assert(result.pageCount === 1, 'Compressed FlateDecode PDF page count is 1');
    assert(result.extractedText.includes('Amdahls law governs the speedup of serial bottlenecks'), 'FlateDecode compressed stream decompressed and extracted correctly');
    assert(result.isScannedOrEmpty === false, 'Compressed PDF is not falsely marked scanned/empty');
    assert(!result.error, 'Compressed PDF has no errors');
  } catch (err: any) {
    assert(false, 'Compressed FlateDecode test threw unexpected error', err.message);
  }

  // 3. Test Reading Order (Multi-line top-to-bottom and left-to-right)
  try {
    // Top line at Y=700, Bottom line at Y=500
    const multiLineStream = `
BT /F1 12 Tf 72 700 Td (First Principle: Identify the Bottleneck.) Tj ET
BT /F1 12 Tf 72 500 Td (Second Principle: Eliminate Sunk Cost Anchors.) Tj ET
`;
    const pdf = createPdfBuffer(multiLineStream, true);
    const result = await extractTextFromPdf(pdf, 'reading_order.pdf');

    const firstIndex = result.extractedText.indexOf('First Principle');
    const secondIndex = result.extractedText.indexOf('Second Principle');

    assert(firstIndex !== -1 && secondIndex !== -1, 'Both lines extracted');
    assert(firstIndex < secondIndex, 'Top line precedes bottom line in reading order', `firstIndex: ${firstIndex}, secondIndex: ${secondIndex}`);
  } catch (err: any) {
    assert(false, 'Reading order test threw unexpected error', err.message);
  }

  // 4. Test Empty / Scanned Document (0 text operations)
  try {
    const emptyStream = ''; // No text operations
    const pdf = createPdfBuffer(emptyStream, false);
    const result = await extractTextFromPdf(pdf, 'scanned_image.pdf');

    assert(result.pageCount === 1, 'Empty/scanned document page count is 1');
    assert(result.isScannedOrEmpty === true, 'Empty/scanned document detected as isScannedOrEmpty');
    assert(result.warning !== undefined && result.warning.includes('No extractable text was found'), 'Diagnostic warning properly explains potential image/OCR necessity');
    assert(!result.error, 'Empty/scanned document does not falsely report corruption error');
  } catch (err: any) {
    assert(false, 'Empty/scanned PDF test threw unexpected error', err.message);
  }

  // 5. Test Corrupted / Malformed PDF
  try {
    const garbageBytes = new Uint8Array([0x54, 0x68, 0x69, 0x73, 0x20, 0x69, 0x73, 0x20, 0x6e, 0x6f, 0x74, 0x20, 0x70, 0x64, 0x66]);
    const result = await extractTextFromPdf(garbageBytes, 'corrupt.pdf');

    assert(result.error !== undefined, 'Malformed PDF triggers error');
    assert(result.error!.includes('not a valid PDF document'), 'Error message clearly indicates invalid PDF format');
  } catch (err: any) {
    assert(false, 'Corrupt PDF test threw unexpected error', err.message);
  }

  // 6. Test File Size Limit Exceeded
  try {
    const fakeData = new Uint8Array(100);
    // Set fileSize argument exceeding limit
    const result = await extractTextFromPdf(fakeData, 'huge_book.pdf', 35 * 1024 * 1024, { maxFileSizeMB: 30 });

    assert(result.error !== undefined, 'Oversized file triggers error');
    assert(result.error!.includes('exceeds the 30MB limit'), 'Error accurately describes file size limit');
  } catch (err: any) {
    assert(false, 'File size limit test threw unexpected error', err.message);
  }

  console.log(`\n--- Test Results: ${passed} passed, ${failed} failed ---\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
