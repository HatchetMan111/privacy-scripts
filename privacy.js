/**
 * privacy.js – Zentrale Datenschutz-Lösung für alle HTML-Rechner
 * Einmalig einbinden: <script src="https://hatchetman111.github.io/privacy-scripts/privacy.js"></script>
 * Version: 1.1 | Stand: 2025
 */

(function () {
  const CONSENT_KEY = 'datenschutz_consent_v1';
  const CONSENT_VERSION = '1';

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
    document.dispatchEvent(new CustomEvent('datenschutz:consent'));
  }

  function revokeConsent() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        keysToRemove.push(localStorage.key(i));
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    removeBanner();
  }

  // ─── 2. SICHERES SPEICHERN (Guard) ───────────────────────────────────────

  window.PrivacyStorage = {
    set: function (key, value) {
      if (!hasConsent()) return false;
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
    const style = document.createElement('style');
    style.textContent = `
      #datenschutz-banner {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
        background: #fff; border-top: 1px solid #e2e0d8;
        box-shadow: 0 -4px 20px rgba(0,0,0,.10);
        font-family: system-ui, sans-serif; font-size: 14px; line-height: 1.5;
      }
      @media (prefers-color-scheme: dark) {
        #datenschutz-banner { background: #1e1d1b; border-top-color: #3a3935; }
      }
      #dsb-inner {
        max-width: 960px; margin: 0 auto; padding: 16px 20px;
        display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap;
      }
      #dsb-icon { font-size: 24px; flex-shrink: 0; margin-top: 2px; }
      #dsb-text { flex: 1; min-width: 220px; color: #555; font-size: 13px; line-height: 1.6; }
      #dsb-text strong { color: #1a1a1a; display: block; margin-bottom: 4px; font-size: 14px; }
      @media (prefers-color-scheme: dark) {
        #dsb-text { color: #9a9890; }
        #dsb-text strong { color: #e8e6dc; }
      }
      #dsb-link { color: #185FA5; font-size: 12px; margin-left: 4px; }
      #dsb-buttons { display: flex; gap: 10px; flex-shrink: 0; align-items: flex-start; flex-wrap: wrap; }
      #dsb-btn-wrap-ok, #dsb-btn-wrap-no { display: flex; flex-direction: column; align-items: center; gap: 4px; }
      #dsb-ok {
        background: #185FA5; color: #fff; border: none;
        border-radius: 8px; padding: 10px 20px; font-size: 13px;
        cursor: pointer; font-weight: 500; white-space: nowrap;
      }
      #dsb-ok:hover { background: #0c447c; }
      #dsb-no {
        background: transparent; color: #666; border: 1px solid #ccc;
        border-radius: 8px; padding: 10px 16px; font-size: 13px;
        cursor: pointer; white-space: nowrap;
      }
      #dsb-no:hover { background: #f5f4f0; }
      @media (prefers-color-scheme: dark) {
        #dsb-no { color: #888; border-color: #444; }
        #dsb-no:hover { background: #2a2927; }
        #dsb-ok { background: #2a5f9e; }
      }
      #dsb-hint-ok { font-size: 11px; color: #3B6D11; text-align: center; }
      #dsb-hint-no { font-size: 11px; color: #888; text-align: center; }
      @media (prefers-color-scheme: dark) {
        #dsb-hint-ok { color: #97C459; }
        #dsb-hint-no { color: #666; }
      }
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.id = 'datenschutz-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Datenschutzhinweis');
    banner.innerHTML = `
      <div id="dsb-inner">
        <span id="dsb-icon" aria-hidden="true">&#128187;</span>
        <div id="dsb-text">
          <strong>Alles l&auml;uft lokal auf deinem Ger&auml;t</strong>
          Dieser Rechner funktioniert vollst&auml;ndig in deinem Browser &ndash; kein Server, keine Weitergabe deiner Daten.
          Damit deine Eingaben beim n&auml;chsten Besuch noch da sind, speichern wir sie lokal auf deinem Ger&auml;t.
          Das EU-Datenschutzrecht verlangt daf&uuml;r deine kurze Zustimmung.
          <a href="/datenschutz" id="dsb-link">Mehr erfahren</a>
        </div>
        <div id="dsb-buttons">
          <div id="dsb-btn-wrap-ok">
            <button id="dsb-ok" onclick="window._privacyGrantConsent()">Ja, Eingaben speichern</button>
            <div id="dsb-hint-ok">&#10003; Eingaben bleiben beim n&auml;chsten Besuch</div>
          </div>
          <div id="dsb-btn-wrap-no">
            <button id="dsb-no" onclick="window._privacyRevokeConsent()">Ohne Speichern fortfahren</button>
            <div id="dsb-hint-no">Rechner funktioniert trotzdem</div>
          </div>
        </div>
      </div>`;

    return banner;
  }

  function removeBanner() {
    const b = document.getElementById('datenschutz-banner');
    if (b) b.remove();
  }

  window._privacyGrantConsent = grantConsent;
  window._privacyRevokeConsent = revokeConsent;

  // ─── 4. FOOTER-INJECT ────────────────────────────────────────────────────

  function injectFooter() {
    if (document.querySelector('footer') || document.getElementById('datenschutz-footer')) return;

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

    const footer = document.createElement('footer');
    footer.id = 'datenschutz-footer';
    footer.innerHTML = `
      <a href="/impressum">Impressum</a> &middot;
      <a href="/datenschutz">Datenschutz</a> &middot;
      <a href="/agb">AGB</a> &middot;
      <a href="#" onclick="window._privacyRevokeConsent();return false;">Einwilligung widerrufen</a>`;
    document.body.appendChild(footer);
  }

  // ─── 5. INITIALISIERUNG ──────────────────────────────────────────────────

  function init() {
    injectFooter();
    if (!hasConsent()) {
      const banner = createBanner();
      document.body.appendChild(banner);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
