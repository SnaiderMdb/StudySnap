// OCR 100% local y gratis — sin API key, sin servidor.
// - Imágenes (JPG/PNG/HEIC→imagen): Tesseract.js en el navegador (spa+eng)
// - PDFs con texto: pdf.js extrae la capa de texto (instantáneo, sin OCR)
// Requiere internet solo para descargar el modelo OCR (~3MB) la primera vez.

import { createWorker } from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';

// Worker de pdf.js vía CDN para no complicar el bundle de Vite.
(pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.4.299/pdf.worker.min.mjs';

export interface OcrProgress {
  status: string;
  progress: number; // 0..1
}

export async function extractTextFromImage(
  file: File | string,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const worker = await createWorker(['spa', 'eng'], undefined, {
    logger: (m: { status: string; progress: number }) => {
      onProgress?.({ status: m.status, progress: m.progress ?? 0 });
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return (data.text ?? '').trim();
  } finally {
    await worker.terminate();
  }
}

export async function extractTextFromPdf(file: File, maxPages = 10): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  const n = Math.min(pdf.numPages, maxPages);
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((it) => ('str' in it ? (it as { str: string }).str : ''))
      .filter(Boolean);
    pages.push(strings.join(' '));
  }
  return pages.join('\n\n').trim();
}

/** Extrae texto de cualquier archivo soportado. Lanza si no hay texto legible. */
export async function extractTextFromFile(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<{ text: string; method: 'pdf-text' | 'ocr' }> {
  if (file.type === 'application/pdf') {
    const text = await extractTextFromPdf(file);
    // PDF escaneado (solo imágenes): sin capa de texto → avisamos.
    // Hacer OCR página-por-página del PDF queda como paso 2 (requiere render a canvas).
    if (text.replace(/\s/g, '').length < 30) {
      throw new Error(
        'Este PDF parece escaneado (sin texto seleccionable). Por ahora sube una foto (JPG/PNG) de la página para usar OCR. El OCR de PDFs escaneados llega en la siguiente versión.',
      );
    }
    return { text, method: 'pdf-text' };
  }
  const text = await extractTextFromImage(file, onProgress);
  if (text.replace(/\s/g, '').length < 10) {
    throw new Error(
      'No pude leer texto en la imagen. Prueba con mejor luz, más cerca y sin sombras.',
    );
  }
  return { text, method: 'ocr' };
}
