import { registerFDSTextRenderer } from './FDSText';
import { registerFDSRadioRenderer } from './FDSRadio';
import { registerFDSCheckboxRenderer } from './FDSCheckbox';
import { registerFDSDropdownRenderer } from './FDSDropdown';
import { registerFDSTagboxRenderer } from './FDSTagbox';
import { registerFDSTextAreaRenderer } from './FDSTextArea';
import { registerFDSToggleRenderer } from './FDSToggle';
import { registerFDSRatingRenderer } from './FDSRating';
import { registerFDSPanelRenderer } from './FDSPanel';

let fdsRenderersRegistered = false;

export function registerAllFDSRenderers(): void {
  if (fdsRenderersRegistered) {
    return;
  }

  registerFDSTextRenderer();
  registerFDSRadioRenderer();
  registerFDSCheckboxRenderer();
  registerFDSDropdownRenderer();
  registerFDSTagboxRenderer();
  registerFDSTextAreaRenderer();
  registerFDSToggleRenderer();
  registerFDSRatingRenderer();
  registerFDSPanelRenderer();

  fdsRenderersRegistered = true;

  if (typeof window !== 'undefined') {
    (window as any).__FDS_RENDERERS_LOADED = true;
  }
}

// Expose the registrar on window so platforms that can't rely on dynamic imports
// (e.g., the single-file WebView bundle) can trigger registration after brand detection.
if (typeof window !== 'undefined') {
  (window as any).__FDS_REGISTER_RENDERERS__ = registerAllFDSRenderers;
}
