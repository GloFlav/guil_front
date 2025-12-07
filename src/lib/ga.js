// src/lib/ga.js
// Helpers GA4 / Google Tag / GTM
// - Utilise par défaut : MEASUREMENT_ID = G-SQG76V00QX
// - Fournit loadGtag, loadGtm, updateConsentAnalytics, trackPageView, trackEvent, pushToDataLayer

const MEASUREMENT_ID = "G-MBSNKPDNB2";    // <-- ton Measurement ID (G-...)
const GTM_CONTAINER = "GTM-WKDGVSPV";    // <-- ton container GTM (optionnel)
const GOOGLE_TAG = "GT-M3V265VJ"        // <-- ton Google Tag (optionnel)

function _isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/* ----------------------
   Util : push dans dataLayer
   ---------------------- */
export function pushToDataLayer(obj = {}) {
  if (!_isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  try {
    window.dataLayer.push(obj);
  } catch (e) {
    // silent
  }
}

/* ----------------------
   Charger GTM (optionnel)
   - Insère le script GTM de façon programmatique
   - Initialise dataLayer si nécessaire
   ---------------------- */
export function loadGtm(containerId = GTM_CONTAINER) {
  if (!_isBrowser()) return;
  if (window._gtmLoaded) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  document.head.appendChild(s);

  window._gtmLoaded = true;
}

/* ----------------------
   Charger gtag.js (GA4)
   - n'envoie pas page_view automatiquement (send_page_view: false)
   ---------------------- */
export function loadGtag(measurementId = MEASUREMENT_ID) {
  if (!_isBrowser()) return;
  if (window.gtagLoaded) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);

  // init sans page_view auto
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true, send_page_view: false });

  window.gtagLoaded = true;
}

/* ----------------------
   Mettre à jour le Consent Mode (analytics_storage / ad_storage)
   - Si gtag présent, on appelle gtag('consent','update', ...)
   - Sinon on pousse une entrée dans dataLayer pour que GTM puisse gérer le consentement
   ---------------------- */
export function updateConsentAnalytics(granted) {
  if (!_isBrowser()) return;
  const value = granted ? "granted" : "denied";

  // si gtag est présent : utilise l'API gtag
  if (window.gtag) {
    try {
      window.gtag('consent', 'update', {
        analytics_storage: value,
        ad_storage: value,
      });
    } catch (e) {
      // fallback to dataLayer push
      pushToDataLayer({ event: 'consent_update', consent: { analytics_storage: value, ad_storage: value } });
    }
    return;
  }

  // sinon on push pour GTM / autres listeners
  pushToDataLayer({ event: 'consent_update', consent: { analytics_storage: value, ad_storage: value } });
}

/* ----------------------
   Envoi page_view
   - si gtag dispo -> gtag('event','page_view',...)
   - sinon -> dataLayer push { event: 'page_view', ... } (GTM peut capter)
   ---------------------- */
export function trackPageView({ path, title, location } = {}) {
  if (!_isBrowser()) return;
  const payload = {
    page_path: path || (window.location && window.location.pathname),
    page_title: title || (document && document.title),
    page_location: location || (window.location && window.location.href),
  };

  if (window.gtag) {
    try {
      window.gtag('event', 'page_view', payload);
      return;
    } catch (e) {
      // fallback
    }
  }

  // fallback -> push dans dataLayer pour GTM
  pushToDataLayer({ event: 'page_view', ...payload });
}

/* ----------------------
   Envoi d'un event personnalisé
   - si gtag dispo -> gtag('event', name, params)
   - sinon -> dataLayer push { event: name, ...params }
   ---------------------- */
export function trackEvent(name, params = {}) {
  if (!_isBrowser() || !name) return;

  if (window.gtag) {
    try {
      window.gtag('event', name, params);
      return;
    } catch (e) {
      // fallback
    }
  }

  pushToDataLayer({ event: name, ...params });
}

/* ----------------------
   Export par défaut utile pour debug
   ---------------------- */
export default {
  MEASUREMENT_ID,
  GTM_CONTAINER,
  GOOGLE_TAG,
  loadGtag,
  loadGtm,
  updateConsentAnalytics,
  trackPageView,
  trackEvent,
  pushToDataLayer,
};
