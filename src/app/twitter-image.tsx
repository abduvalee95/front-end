import Image from './opengraph-image';

// Twitter card uses the same image as Open Graph.
// Segment config must be re-declared (cannot be re-exported in Next.js).
export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = "Bilim Nuru — O'quv markaz uchun CRM + LMS";

export default Image;
