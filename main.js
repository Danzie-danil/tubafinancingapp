import { initAuth } from './js/modules/auth.js';
import { initSync } from './js/modules/syncManager.js';

document.addEventListener('DOMContentLoaded', async () => {
  try { await initAuth(); } catch {}
  try { initSync(); } catch {}
});
