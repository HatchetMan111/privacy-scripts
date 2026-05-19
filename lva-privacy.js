/**
 * lva-privacy.js – LichtValleyApps Komplettlösung Datenschutz
 * ─────────────────────────────────────────────────────────────
 * Enthält:
 *   ✅ Google Consent Mode v2 (GA wird erst nach Einwilligung aktiv)
 *   ✅ Google Fonts Blocking (erst nach Einwilligung)
 *   ✅ Cookie-Banner im LichtValley-Stil (Schwarz / #FFD234)
 *   ✅ PrivacyStorage Guard (localStorage nur nach Einwilligung)
 *   ✅ Footer mit Impressum / Datenschutz / Cookie-Einstellungen
 *   ✅ Widerruf jederzeit möglich
 *
 * GitHub: https://hatchetman111.github.io/privacy-scripts/lva-privacy.js
 *
 * Einbinden – 1× pro Seite als ERSTEN Custom Code Block:
 * <script src="https://hatchetman111.github.io/privacy-scripts/lva-privacy.js"></script>
 *
 * Rechner-Speicherung (statt localStorage direkt):
 *   PrivacyStorage.set('mein-key', wert)
 *   PrivacyStorage.get('mein-key', null)
 *   PrivacyStorage.remove('mein-key')
 *
 * Version: 2.0 | Stand: 2025 | lichtvalleyapps.de
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // KONFIGURATION
  // ═══════════════════════════════════════════════════════════════
  const CFG = {
    gaId:         'G-2QV8FFQK3B',
    consentKey:   'lva_consent_v2',
    consentVer:   '2',
    privacyUrl:   '/datenschutz',
    impressumUrl: '/impressum',
    fontsUrl:     'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap'
  };

  // ═══════════════════════════════════════════════════════════════
  // 1. GOOGLE CONSENT MODE v2 – SOFORT (vor GA-Init durch Softr)
  // ═══════════════════════════════════════════════════════════════
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag('consent', 'default', {
    ad_storage:              'denied',
    ad_user_data:            'denied',
    ad_personalization:      'denied',
    analytics_storage:       'denied',
    functionality_storage:   'denied',
    personalization_storage: 'denied',
    security_storage:        'granted',
    wait_for_update:         500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);

  // ═══════════════════════════════════════════════════════════════
  // 2. CONSENT SPEICHERN / LADEN
  // ═══════════════════════════════════════════════════════════════
  function loadConsent() {
    try {
      const raw = localStorage.getItem(CFG.consentKey);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return d.version === CFG.consentVer ? d : null;
    } catch { return null; }
  }

  function saveConsent(analytics) {
    try {
      localStorage.setItem(CFG.consentKey, JSON.stringify({
        version:   CFG.consentVer,
        analytics: analytics,
        necessary: true,
        timestamp: new Date().toISOString()
      }));
    } catch (e) { console.warn('[LVA] Consent speichern fehlgeschlagen:', e); }
  }

  function hasConsent() {
    const c = loadConsent();
    return c !== null;
  }

  function hasAnalyticsConsent() {
    const c = loadConsent();
    return c ? c.analytics === true : false;
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. CONSENT MODE UPDATEN + FONTS LADEN
  // ═══════════════════════════════════════════════════════════════
  function applyConsent(analytics) {
    const state = analytics ? 'granted' : 'denied';
    gtag('consent', 'update', {
      analytics_storage:       state,
      functionality_storage:   state,
      personalization_storage: 'denied',
      ad_storage:              'denied',
      ad_user_data:            'denied',
      ad_personalization:      'denied'
    });
    if (analytics) loadFonts();
    // Event für Rechner (falls sie auf Consent warten)
    document.dispatchEvent(new CustomEvent('lva:consent', { detail: { analytics, necessary: true } }));
  }

  function loadFonts() {
    if (document.getElementById('lva-fonts')) return;
    const link = document.createElement('link');
    link.id   = 'lva-fonts';
    link.rel  = 'stylesheet';
    link.href = CFG.fontsUrl;
    document.head.appendChild(link);
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. PRIVACYSTORAGE – sicherer localStorage Guard
  // ═══════════════════════════════════════════════════════════════
  window.PrivacyStorage = {
    /**
     * Wert speichern – nur wenn Einwilligung vorhanden
     * Nutzung: PrivacyStorage.set('solar-ergebnis', { kwp: 5 })
     */
    set: function (key, value) {
      if (!hasConsent()) {
        console.info('[LVA] Speichern pausiert – warte auf Einwilligung.');
        // Nach Einwilligung automatisch speichern
        document.addEventListener('lva:consent', function handler() {
          try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
          document.removeEventListener('lva:consent', handler);
        });
        return false;
      }
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (e) { console.warn('[LVA] Speichern fehlgeschlagen:', e); return false; }
    },

    /** Wert lesen */
    get: function (key, fallback) {
      if (fallback === undefined) fallback = null;
      if (!hasConsent()) return fallback;
      try {
        const v = localStorage.getItem(key);
        return v !== null ? JSON.parse(v) : fallback;
      } catch { return fallback; }
    },

    /** Einzelnen Wert löschen */
    remove: function (key) {
      try { localStorage.removeItem(key); } catch {}
    },

    /** Alle LVA-Rechner-Daten löschen (außer Consent selbst) */
    clearAll: function () {
      try {
        const keep = [CFG.consentKey];
        Object.keys(localStorage)
          .filter(k => !keep.includes(k))
          .forEach(k => localStorage.removeItem(k));
      } catch {}
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 5. STYLES
  // ═══════════════════════════════════════════════════════════════
  function injectStyles() {
    if (document.getElementById('lva-styles')) return;
    const s = document.createElement('style');
    s.id = 'lva-styles';
    s.textContent = `
      #lva-overlay {
        position:fixed;inset:0;z-index:99998;
        background:rgba(0,0,0,.6);
        backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
        display:flex;align-items:flex-end;justify-content:center;
        animation:lvaFadeIn .3s ease;
      }
      @keyframes lvaFadeIn{from{opacity:0}to{opacity:1}}

      #lva-box {
        background:#111111;border-top:3px solid #FFD234;
        width:100%;padding:24px 20px 20px;
        box-shadow:0 -8px 40px rgba(0,0,0,.6);
        font-family:system-ui,-apple-system,sans-serif;
        animation:lvaSlideUp .35s cubic-bezier(.4,0,.2,1);
        position:relative;z-index:99999;box-sizing:border-box;
      }
      @keyframes lvaSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      @media(min-width:700px){
        #lva-box{max-width:800px;border-radius:16px 16px 0 0;margin:0 auto;}
      }

      #lva-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
      #lva-logo{width:30px;height:30px;background:#FFD234;border-radius:7px;
        display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
      #lva-title{font-size:15px;font-weight:700;color:#FFD234;margin:0;}

      #lva-text{font-size:13px;color:#aaa;line-height:1.65;margin-bottom:16px;}
      #lva-text a{color:#FFD234;text-decoration:none;}
      #lva-text a:hover{text-decoration:underline;}
      #lva-text strong{color:#ddd;}

      #lva-cats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;}
      @media(max-width:480px){#lva-cats{grid-template-columns:1fr;}}

      .lva-cat{
        background:#1c1c1c;border:1px solid #2a2a2a;border-radius:10px;
        padding:10px 12px;display:flex;align-items:center;
        justify-content:space-between;gap:10px;
        transition:border-color .2s;cursor:pointer;
      }
      .lva-cat:hover{border-color:#FFD234;}
      .lva-cat-info{flex:1;}
      .lva-cat-name{font-size:12px;font-weight:600;color:#ddd;display:block;margin-bottom:2px;}
      .lva-cat-desc{font-size:11px;color:#555;}

      .lva-tog{
        width:38px;height:22px;border-radius:11px;
        flex-shrink:0;position:relative;cursor:pointer;
        transition:background .2s;border:none;outline:none;padding:0;
        background:#333;
      }
      .lva-tog::after{
        content:'';position:absolute;
        width:16px;height:16px;background:#fff;border-radius:50%;
        top:3px;left:3px;transition:transform .2s;
      }
      .lva-tog.on{background:#FFD234;}
      .lva-tog.on::after{transform:translateX(16px);background:#111;}
      .lva-tog:disabled{opacity:.45;cursor:not-allowed;}

      #lva-btns{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
      .lva-btn{
        padding:11px 20px;border-radius:8px;font-size:13px;font-weight:600;
        cursor:pointer;border:none;font-family:system-ui,sans-serif;
        transition:all .2s;min-height:42px;white-space:nowrap;
      }
      .lva-btn-yes{background:#FFD234;color:#111;}
      .lva-btn-yes:hover{background:#e6bd20;transform:translateY(-1px);}
      .lva-btn-no{background:transparent;color:#888;border:1px solid #333;}
      .lva-btn-no:hover{border-color:#666;color:#ccc;}
      .lva-btn-sel{background:transparent;color:#555;border:1px solid #222;font-size:12px;padding:11px 14px;}
      .lva-btn-sel:hover{color:#999;border-color:#444;}

      #lva-links{margin-top:12px;font-size:11px;color:#444;display:flex;gap:14px;flex-wrap:wrap;}
      #lva-links a{color:#555;text-decoration:none;}
      #lva-links a:hover{color:#888;text-decoration:underline;}

      #lva-reopen{
        position:fixed;bottom:20px;left:20px;z-index:9998;
        background:#111;color:#FFD234;border:1px solid #2a2a2a;
        border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;
        font-family:system-ui,sans-serif;cursor:pointer;display:none;
        box-shadow:0 2px 12px rgba(0,0,0,.5);transition:all .2s;
      }
      #lva-reopen:hover{background:#1a1a1a;border-color:#FFD234;}

      #lva-footer{
        text-align:center;padding:14px 20px;font-size:12px;color:#444;
        font-family:system-ui,sans-serif;border-top:1px solid #1a1a1a;
        margin-top:40px;
      }
      #lva-footer a{color:#555;text-decoration:none;margin:0 6px;}
      #lva-footer a:hover{color:#888;text-decoration:underline;}
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. BANNER RENDERN
  // ═══════════════════════════════════════════════════════════════
  let _analyticsChoice = false;

  function showBanner() {
    if (document.getElementById('lva-overlay')) return;
    _analyticsChoice = hasAnalyticsConsent();

    const overlay = document.createElement('div');
    overlay.id = 'lva-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Datenschutz-Einstellungen');

    overlay.innerHTML = `
      <div id="lva-box">
        <div id="lva-head">
          <div id="lva-logo">🔒</div>
          <div id="lva-title">LichtValleyApps · Datenschutz & Cookies</div>
        </div>
        <div id="lva-text">
          Wir nutzen <strong>Google Analytics</strong> um unsere Website zu verbessern.
          Deine Rechner-Eingaben bleiben <strong>immer nur lokal</strong> in deinem Browser –
          kein Server, keine Weitergabe an uns.
          GA überträgt anonymisierte Nutzungsdaten an Google (USA, Standardvertragsklauseln).
          Details in unserer <a href="${CFG.privacyUrl}" target="_blank">Datenschutzerklärung</a>.
        </div>
        <div id="lva-cats">
          <div class="lva-cat" style="cursor:default;">
            <div class="lva-cat-info">
              <span class="lva-cat-name">✅ Notwendig</span>
              <span class="lva-cat-desc">Rechner-Speicherung · immer aktiv</span>
            </div>
            <button class="lva-tog on" disabled aria-label="Notwendig immer aktiv"></button>
          </div>
          <div class="lva-cat" onclick="document.getElementById('lva-tog-ga').click()">
            <div class="lva-cat-info">
              <span class="lva-cat-name">📊 Statistik (Google Analytics)</span>
              <span class="lva-cat-desc">Anonyme Nutzungsanalyse · optional</span>
            </div>
            <button class="lva-tog ${_analyticsChoice ? 'on' : ''}" id="lva-tog-ga"
              aria-label="Statistik umschalten"
              onclick="event.stopPropagation();_lvaToggleGA(this)"></button>
          </div>
        </div>
        <div id="lva-btns">
          <button class="lva-btn lva-btn-yes" onclick="_lvaAcceptAll()">Allen zustimmen</button>
          <button class="lva-btn lva-btn-no"  onclick="_lvaRejectAll()">Ablehnen</button>
          <button class="lva-btn lva-btn-sel" onclick="_lvaSaveSelection()">Auswahl speichern</button>
        </div>
        <div id="lva-links">
          <a href="${CFG.privacyUrl}" target="_blank">Datenschutzerklärung</a>
          <a href="${CFG.impressumUrl}" target="_blank">Impressum</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. BUTTON-AKTIONEN (global damit onclick funktioniert)
  // ═══════════════════════════════════════════════════════════════
  window._lvaToggleGA = function(btn) {
    _analyticsChoice = !_analyticsChoice;
    btn.classList.toggle('on', _analyticsChoice);
  };
  window._lvaAcceptAll    = function() { _lvaCommit(true);  };
  window._lvaRejectAll    = function() { _lvaCommit(false); };
  window._lvaSaveSelection = function() { _lvaCommit(_analyticsChoice); };

  function _lvaCommit(analytics) {
    saveConsent(analytics);
    applyConsent(analytics);
    closeBanner();
    showReopenBtn();
  }

  function closeBanner() {
    const el = document.getElementById('lva-overlay');
    if (el) el.remove();
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. REOPEN-BUTTON & FOOTER
  // ═══════════════════════════════════════════════════════════════
  function showReopenBtn() {
    let btn = document.getElementById('lva-reopen');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'lva-reopen';
      btn.innerHTML = '🍪 Cookie-Einstellungen';
      btn.onclick = function () {
        closeBanner();
        showBanner();
      };
      document.body.appendChild(btn);
    }
    btn.style.display = 'block';
  }

  function injectFooter() {
    if (document.getElementById('lva-footer')) return;
    const f = document.createElement('div');
    f.id = 'lva-footer';
    f.innerHTML = `
      <a href="${CFG.impressumUrl}">Impressum</a> ·
      <a href="${CFG.privacyUrl}">Datenschutz</a> ·
      <a href="#" onclick="document.getElementById('lva-reopen')?.click();return false;">Cookie-Einstellungen</a>
    `;
    document.body.appendChild(f);
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. INITIALISIERUNG
  // ═══════════════════════════════════════════════════════════════
  function init() {
    injectStyles();
    injectFooter();

    const saved = loadConsent();
    if (saved !== null) {
      // Bereits entschieden → Consent anwenden, nur Reopen-Button zeigen
      applyConsent(saved.analytics);
      showReopenBtn();
    } else {
      // Noch keine Entscheidung → Banner zeigen
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
