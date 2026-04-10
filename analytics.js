/**
 * Optional: Google Analytics 4 + Sentry (browser).
 * Set IDs in index.html: window.PROPERTIKU_CONFIG = { ga4MeasurementId: 'G-XXX', sentryDsn: 'https://...' }
 * Leave empty to disable (no network calls).
 */
(function () {
  var cfg = window.PROPERTIKU_CONFIG || {};
  var gaId = (cfg.ga4MeasurementId || '').trim();
  var dsn = (cfg.sentryDsn || '').trim();
  if (!gaId && !dsn) return;

  if (gaId) {
    var gscript = document.createElement('script');
    gscript.async = true;
    gscript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(gscript);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId, { anonymize_ip: true });
  }

  if (dsn) {
    var sentryScript = document.createElement('script');
    sentryScript.src = 'https://browser.sentry-cdn.com/7.120.0/bundle.min.js';
    sentryScript.crossOrigin = 'anonymous';
    sentryScript.onload = function () {
      if (typeof Sentry !== 'undefined') {
        Sentry.init({
          dsn: dsn,
          environment: cfg.environment || 'production',
          tracesSampleRate: 0.05
        });
      }
    };
    document.head.appendChild(sentryScript);
  }
})();
