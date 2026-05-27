/**
 * downloadReceiptPdf
 *
 * Renders an HTMLElement to a canvas via html2canvas-pro (supports oklch colors
 * used by Tailwind v4), then embeds it into a jsPDF document sized for either
 * A4 portrait or an 80mm thermal receipt, and triggers download.
 *
 * Both libraries are dynamically imported so they stay out of the initial bundle.
 */

export type PdfFormat = 'A4' | 'THERMAL_80';

// 80mm thermal receipt: 80mm wide, height computed from content
const THERMAL_WIDTH_MM = 80;

export async function downloadReceiptPdf(
  node: HTMLElement,
  filename: string,
  format: PdfFormat = 'A4',
): Promise<void> {
  try {
    await _generatePdf(node, filename, format);
  } catch (err) {
    throw err instanceof Error ? err : new Error('PDF generation failed');
  }
}

async function _generatePdf(
  node: HTMLElement,
  filename: string,
  format: PdfFormat,
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  // Render at 2x scale for crisp output
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const canvasWidthPx = canvas.width;
  const canvasHeightPx = canvas.height;

  // Release GPU-backed canvas memory as soon as the pixel data is captured
  if (canvas.parentNode) canvas.remove();
  canvas.width = 0;
  canvas.height = 0;

  if (format === 'A4') {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();
    // Scale to fit width; if content is taller than page, scale to fit height
    const imgAspect = canvasHeightPx / canvasWidthPx;
    let imgW = pageWidthMm;
    let imgH = imgW * imgAspect;
    if (imgH > pageHeightMm) {
      imgH = pageHeightMm;
      imgW = imgH / imgAspect;
    }
    const xOffset = (pageWidthMm - imgW) / 2;
    const yOffset = (pageHeightMm - imgH) / 2;
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgW, imgH);
    pdf.save(`${filename}.pdf`);
  } else {
    // Thermal 80mm: dynamic height based on content aspect ratio
    const pxPerMm = canvasWidthPx / THERMAL_WIDTH_MM;
    const heightMm = canvasHeightPx / pxPerMm;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [THERMAL_WIDTH_MM, heightMm],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, THERMAL_WIDTH_MM, heightMm);
    pdf.save(`${filename}.pdf`);
  }
}
