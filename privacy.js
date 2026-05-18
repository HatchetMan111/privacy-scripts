/**
 * privacy.js – Zentrale Datenschutz-Lösung für alle HTML-Rechner
 * Einmalig einbinden: <script src="/shared/privacy.js"></script>
 * Version: 1.0 | Stand: 2025
 */

(function () {
  const CONSENT_KEY = 'datenschutz_consent_v1';
  const CONSENT_VERSION = '1'; // Erhöhen, wenn sich die Datenschutzerklärung wesentlich ändert

  // ─── 1. CONSENT-VERWALTUNG ───────────────────────────────────────────────

  function hasConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION;
    } catch {
      return false;
    }
  }

  function grantConsent() {
    try {
      localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
    } catch (e) {
      console.warn('localStorage nicht verfügbar:', e);
    }
    removeBanner();
    // Event feuern, damit Rechner auf Einwilligung reagieren können
    document.dispatchEvent(new CustomEvent('datenschutz:consent'));
  }

  function revokeConsent() {
    try {
      // Alle gespeicherten Rechner-Daten löschen
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        keysToRemove.push(localStorage.key(i));
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    removeBanner();
  }

  // ─── 2. SICHERES SPEICHERN (Guard) ───────────────────────────────────────

  /**
   * Sicheres Speichern – nur nach Einwilligung.
   * Nutzung im Rechner: PrivacyStorage.set('mein-rechner-key', wert)
   */
  window.PrivacyStorage = {
    set: function (key, value) {
      if (!hasConsent()) {
        console.warn('Speichern verweigert – keine Einwilligung vorhanden.');
        return false;
      }
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    get: function (key, fallback = null) {
      if (!hasConsent()) return fallback;
      try {
        const val = localStorage.getItem(key);
        return val !== null ? JSON.parse(val) : fallback;
      } catch {
        return fallback;
      }
    },
    remove: function (key) {
      try { localStorage.removeItem(key); } catch {}
    }
  };

  // ─── 3. BANNER ───────────────────────────────────────────────────────────

  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'datenschutz-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Datenschutzhinweis');
    banner.innerHTML = `
      <div id="dsb-inner">
        <span id="dsb-icon" aria-hidden="true">&#128274;</span>
        <div id="dsb-text">
          <strong>Lokale Datenspeicherung</strong>
          Deine Eingaben werden <strong>nur lokal in deinem Browser</strong> gespeichert –
          kein Server, keine Weitergabe, keine Cookies.
          <a href="/datenschutz" id="dsb-link">Mehr erfahren</a>
        </div>
        <div id="dsb-buttons">
          <button id="dsb-ok" onclick="window._privacyGrantConsent()">OK, verstanden</button>
          <button id="dsb-no" onclick="window._privacyRevokeConsent()">Ablehnen</button>
        </div>
      </div>`;
    
    const style = document.createElement('style');
    style.textContent = `
      #datenschutz-banner {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
        background: #fff; border-top: 1px solid #e2e0d8;
        box-shadow: 0 -2px 12px rgba(0,0,0,.08);
        font-family: system-ui, sans-serif; font-size: 14px; line-height: 1.5;
      }
      @media (prefers-color-scheme: dark) {
        #datenschutz-banner { background: #1e1d1b; border-top-color: #3a3935; color: #c2c0b6; }
        #dsb-ok { background: #2a5f9e; color: #fff; }
      }
      #dsb-inner {
        max-width: 900px; margin: 0 auto; padding: 14px 20px;
        display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
      }
      #dsb-icon { font-size: 22px; flex-shrink: 0; }
      #dsb-text { flex: 1; min-width: 200px; color: #555; font-size: 13px; }
      #dsb-text strong { color: #1a1a1a; display: block; margin-bottom: 2px; }
      @media (prefers-color-scheme: dark) { #dsb-text { color: #9a9890; } #dsb-text strong { color: #e8e6dc; } }
      #dsb-link { color: #185FA5; font-size: 12px; margin-left: 6px; }
      #dsb-buttons { display: flex; gap: 8px; flex-shrink: 0; }
      #dsb-ok {
        background: #185FA5; color: #fff; border: none;
        border-radius: 6px; padding: 8px 18px; font-size: 13px;
        cursor: pointer; font-weight: 500;
      }
      #dsb-ok:hover { background: #0c447c; }
      #dsb-no {
        background: transparent; color: #777; border: 1px solid #ccc;
        border-radius: 6px; padding: 8px 14px; font-size: 13px; cursor: pointer;
      }
      #dsb-no:hover { background: #f5f4f0; }
    `;
    document.head.appendChild(style);
    return banner;
  }

  function removeBanner() {
    const b = document.getElementById('datenschutz-banner');
    if (b) b.remove();
  }

  // Globale Funktionen für die onclick-Attribute im Banner
  window._privacyGrantConsent = grantConsent;
  window._privacyRevokeConsent = revokeConsent;

  // ─── 4. FOOTER-INJECT ────────────────────────────────────────────────────

  function injectFooter() {
    // Nur einfügen, wenn kein Footer-Element existiert
    if (document.querySelector('footer') || document.getElementById('datenschutz-footer')) return;
    
    const footer = document.createElement('footer');
    footer.id = 'datenschutz-footer';
    footer.innerHTML = `
      <a href="/impressum">Impressum</a> ·
      <a href="/datenschutz">Datenschutz</a> ·
      <a href="/agb">AGB</a> ·
      <a href="#" onclick="window._privacyRevokeConsent();return false;">Einwilligung widerrufen</a>`;
    
    const style = document.createElement('style');
    style.textContent = `
      #datenschutz-footer {
        text-align: center; padding: 20px; margin-top: 40px;
        font-size: 12px; color: #888; border-top: 1px solid #e8e6dc;
        font-family: system-ui, sans-serif;
      }
      #datenschutz-footer a { color: #888; text-decoration: none; margin: 0 6px; }
      #datenschutz-footer a:hover { text-decoration: underline; }
      @media (prefers-color-scheme: dark) {
        #datenschutz-footer { color: #666; border-top-color: #333; }
        #datenschutz-footer a { color: #666; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(footer);
  }

  // ─── 5. INITIALISIERUNG ───────────────────────────────────────────────────

  function init() {
    injectFooter();
    if (!hasConsent()) {
      const banner = createBanner();
      document.body.appendChild(banner);
    }
  }

  // Warten bis DOM bereit ist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
