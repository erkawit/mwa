import { PDFDocument, rgb, StandardFonts, degrees as pdfDegrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function loadPdf(data: ArrayBuffer): Promise<PDFDocument> {
  return await PDFDocument.load(data);
}

export function getPageCount(pdf: PDFDocument): number {
  return pdf.getPageCount();
}

export async function renderPageToCanvas(pdfData: ArrayBuffer, pageIndex: number, canvas: HTMLCanvasElement, scale: number): Promise<void> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfData) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageIndex + 1); // pdfjs uses 1-based indexing

  const viewport = page.getViewport({ scale });
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: canvas.getContext('2d')!,
    viewport: viewport,
    canvas: canvas
  };

  await page.render(renderContext).promise;
}

export async function addTextToPdf(pdf: PDFDocument, pageIndex: number, text: string, x: number, y: number, fontSize: number, colorHex: string): Promise<PDFDocument> {
  const pages = pdf.getPages();
  const page = pages[pageIndex];
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  // Convert hex to rgb components (0-1)
  const r = parseInt(colorHex.slice(1, 3), 16) / 255;
  const g = parseInt(colorHex.slice(3, 5), 16) / 255;
  const b = parseInt(colorHex.slice(5, 7), 16) / 255;

  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(r, g, b),
  });

  return pdf;
}

export async function addImageToPdf(pdf: PDFDocument, pageIndex: number, imageBytes: ArrayBuffer, x: number, y: number, width: number, height: number): Promise<PDFDocument> {
  const pages = pdf.getPages();
  const page = pages[pageIndex];
  
  // Attempt to determine if png or jpeg
  let image;
  try {
    image = await pdf.embedPng(imageBytes);
  } catch (e) {
    image = await pdf.embedJpg(imageBytes);
  }

  page.drawImage(image, {
    x,
    y,
    width,
    height,
  });

  return pdf;
}

export async function mergePdfs(pdfDataArray: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const pdfData of pdfDataArray) {
    const pdf = await PDFDocument.load(pdfData);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

export async function splitPdf(pdfData: ArrayBuffer, pageRanges: [number, number][]): Promise<Uint8Array[]> {
  const sourcePdf = await PDFDocument.load(pdfData);
  const resultPdfs: Uint8Array[] = [];

  for (const [start, end] of pageRanges) {
    const newPdf = await PDFDocument.create();
    const indicesToCopy = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const copiedPages = await newPdf.copyPages(sourcePdf, indicesToCopy);
    copiedPages.forEach((page) => newPdf.addPage(page));
    resultPdfs.push(await newPdf.save());
  }

  return resultPdfs;
}

export async function rotatePage(pdf: PDFDocument, pageIndex: number, degrees: 0 | 90 | 180 | 270): Promise<PDFDocument> {
  const pages = pdf.getPages();
  const page = pages[pageIndex];
  page.setRotation(pdfDegrees(degrees));
  return pdf;
}

export async function deletePage(pdf: PDFDocument, pageIndex: number): Promise<PDFDocument> {
  pdf.removePage(pageIndex);
  return pdf;
}

export async function reorderPages(pdf: PDFDocument, newOrder: number[]): Promise<PDFDocument> {
  const tempDoc = await PDFDocument.create();
  const copiedPages = await tempDoc.copyPages(pdf, newOrder);
  copiedPages.forEach(p => tempDoc.addPage(p));
  
  // Clear original document pages
  const pageCount = pdf.getPageCount();
  for (let i = pageCount - 1; i >= 0; i--) {
    pdf.removePage(i);
  }

  // Add them back in new order
  // Note: we can't easily add pages from tempDoc to pdf directly without copying again, 
  // so a better approach is creating a new doc entirely. But function returns modified pdf.
  // We'll copy them from tempDoc back to pdf
  const recopiedPages = await pdf.copyPages(tempDoc, tempDoc.getPageIndices());
  recopiedPages.forEach(p => pdf.addPage(p));
  
  return pdf;
}

export async function addWatermark(pdf: PDFDocument, text: string, opacity: number): Promise<PDFDocument> {
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    const textSize = 50;
    const textWidth = font.widthOfTextAtSize(text, textSize);
    const textHeight = font.heightAtSize(textSize);
    
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: textSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: pdfDegrees(45),
    });
  }

  return pdf;
}

export async function compressPdf(pdfData: ArrayBuffer): Promise<Uint8Array> {
  // basic optimization: load and save
  const pdf = await PDFDocument.load(pdfData);
  return await pdf.save({ useObjectStreams: false });
}

export async function savePdf(pdf: PDFDocument): Promise<Uint8Array> {
  return await pdf.save();
}

export async function addBlankPage(pdf: PDFDocument, width?: number, height?: number): Promise<PDFDocument> {
  pdf.addPage(width && height ? [width, height] : undefined);
  return pdf;
}

export async function imagesToPdf(imageDataArray: { data: ArrayBuffer; type: 'png' | 'jpg' }[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const imgData of imageDataArray) {
    const image = imgData.type === 'png' 
      ? await pdf.embedPng(imgData.data)
      : await pdf.embedJpg(imgData.data);
    
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return await pdf.save();
}
