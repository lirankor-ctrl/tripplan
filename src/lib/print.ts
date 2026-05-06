// Print orchestration. Two modes:
//   - "summary"  : portrait, shows the textual trip recap, hides the calendar.
//   - "calendar" : landscape, shows the visual weekly calendar, hides the summary.
//
// Visibility is controlled by `body.print-mode-*` classes paired with
// `data-print-target` attributes in globals.css. Landscape orientation for
// "calendar" is injected at print time via a temporary <style> tag — there's
// no per-element @page selector in CSS, so we toggle it globally for one
// invocation and tear it down on `afterprint`.

export type PrintMode = 'summary' | 'calendar';

export function printWithMode(mode: PrintMode): void {
  if (typeof window === 'undefined') return;

  const cls = mode === 'calendar' ? 'print-mode-calendar' : 'print-mode-summary';
  document.body.classList.add(cls);

  let styleEl: HTMLStyleElement | null = null;
  if (mode === 'calendar') {
    styleEl = document.createElement('style');
    styleEl.textContent = '@page { size: A4 landscape; margin: 8mm; }';
    document.head.appendChild(styleEl);
  }

  const cleanup = () => {
    document.body.classList.remove(cls);
    styleEl?.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  // Defer one frame so the class lands before the browser snapshots layout
  // for the print preview. Without this, Safari occasionally prints the
  // pre-class state on the first invocation.
  requestAnimationFrame(() => window.print());
}
