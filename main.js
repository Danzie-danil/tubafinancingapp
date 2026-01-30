import { state } from './js/modules/state.js';
import { showToast, render, openModalById, closeModalById, closeAllModals, openPinSetModal, promptForPin, promptToSetPin, resetPinSetModalFields } from './js/modules/ui.js';
import { hashPin, setSecurityPin, requirePinForDestructive, getCurrencySymbol, setCurrency, applyCurrencySymbols, loadLibrary, urlBase64ToUint8Array } from './js/modules/utils.js';
import { initSupabase, restoreSession, loadUserProfile } from './js/modules/auth.js';
import { getStats, pushAllDataToSupabase, pullDataFromSupabase } from './js/modules/data.js';
import { initSync, deleteQueue, upsertQueue } from './js/modules/syncManager.js';

window.state = state;
window.showToast = showToast;
window.render = render;
window.openModalById = openModalById;
window.closeModalById = closeModalById;
window.closeAllModals = closeAllModals;
window.openPinSetModal = openPinSetModal;
window.promptForPin = promptForPin;
window.promptToSetPin = promptToSetPin;
window.resetPinSetModalFields = resetPinSetModalFields;

window.hashPin = hashPin;
window.setSecurityPin = setSecurityPin;
window.requirePinForDestructive = requirePinForDestructive;
window.getCurrencySymbol = getCurrencySymbol;
window.setCurrency = setCurrency;
window.applyCurrencySymbols = applyCurrencySymbols;
window.loadLibrary = loadLibrary;
window.urlBase64ToUint8Array = urlBase64ToUint8Array;

window.initSupabase = initSupabase;
window.restoreSession = restoreSession;
window.loadUserProfile = loadUserProfile;

window.getStats = getStats;
window.pushAllDataToSupabase = pushAllDataToSupabase;
window.pullDataFromSupabase = pullDataFromSupabase;

window.initSync = initSync;
window.deleteQueue = deleteQueue;
window.upsertQueue = upsertQueue;

document.addEventListener('DOMContentLoaded', async () => {
  try { 
    await initAuth(); 
  } catch (e) { 
    console.error('Auth init error:', e); 
  }
  try { 
    initSync(); 
  } catch (e) { 
    console.error('Sync init error:', e); 
  }
});