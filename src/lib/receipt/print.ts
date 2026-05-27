/**
 * printReceipt
 *
 * Opens a hidden iframe, injects the receipt node HTML plus the parent page's
 * stylesheets, sets the appropriate @page size, then triggers window.print().
 * The iframe is removed after printing completes so the host document is not mutated.
 */

export type PrintFormat = 'A4' | 'THERMAL_80';

export function printReceipt(node: HTMLElement, format: PrintFormat = 'A4'): void {
  const pageRule =
    format === 'A4'
      ? '@page { size: A4 portrait; margin: 15mm; }'
      : '@page { size: 80mm auto; margin: 4mm; }';

  // Clone stylesheets from parent document
  const styleLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    .map((l) => `<link rel="stylesheet" href="${l.href}" />`)
    .join('\n');

  const styleBlocks = Array.from(document.querySelectorAll<HTMLStyleElement>('style'))
    .map((s) => `<style>${s.textContent ?? ''}</style>`)
    .join('\n');

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    ${styleLinks}
    ${styleBlocks}
    <style>
      ${pageRule}
      body { margin: 0; padding: 0; background: white; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
  </head>
  <body>${node.outerHTML}</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  // Capture focus target so we can restore it after print dialog closes
  const previousFocus = document.activeElement as HTMLElement | null;

  let removed = false;
  const cleanup = () => {
    if (removed) return;
    removed = true;
    iframe.contentWindow?.removeEventListener('afterprint', onAfterPrint);
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    previousFocus?.focus();
  };

  // Primary: clean up after the print dialog closes (with small visual-settle delay)
  const onAfterPrint = () => setTimeout(cleanup, 500);

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) return;
    win.addEventListener('afterprint', onAfterPrint);
    win.focus();
    win.print();
    // Fallback: if afterprint never fires (user cancels immediately, browser quirk),
    // force-remove the iframe after 60 s to prevent permanent DOM leak.
    setTimeout(cleanup, 60_000);
  };

  iframe.srcdoc = html;
}
