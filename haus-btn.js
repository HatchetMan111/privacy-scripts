/**
 * haus-btn.js – LichtValleyApps LichtValleyHaus Button
 * Einbinden: <script src="https://hatchetman111.github.io/privacy-scripts/haus-btn.js"></script>
 */
(function () {
  function init() {
    if (document.getElementById('lva-haus')) return;

    const style = document.createElement('style');
    style.textContent = `
      #lva-haus {
        position: fixed; bottom: 14px; right: 168px; z-index: 9998;
        background: #FFD234; color: #111; border: 2px solid #111;
        border-radius: 50%; width: 42px; height: 42px;
        font-size: 19px; cursor: pointer; display: flex;
        box-shadow: 0 2px 14px rgba(0,0,0,.25); transition: all .2s;
        align-items: center; justify-content: center; padding: 0;
        text-decoration: none;
      }
      #lva-haus:hover { background: #111; color: #FFD234; transform: scale(1.12); }
      #lva-haus::after {
        content: 'LichtValleyHaus';
        position: absolute; right: 50px; bottom: 50%; transform: translateY(50%);
        background: #111; color: #FFD234; border: 1px solid #333;
        font-size: 11px; font-weight: 600; white-space: nowrap;
        padding: 5px 10px; border-radius: 6px; pointer-events: none;
        opacity: 0; transition: opacity .2s; font-family: system-ui, sans-serif;
      }
      #lva-haus:hover::after { opacity: 1; }
    `;
    document.head.appendChild(style);

    const a = document.createElement('a');
    a.id = 'lva-haus';
    a.href = 'https://www.lichtvalleyapps.de/lichtvalleyhaus';
    a.innerHTML = '🏠';
    a.setAttribute('aria-label', 'LichtValleyHaus');
    a.title = 'LichtValleyHaus';
    document.body.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
