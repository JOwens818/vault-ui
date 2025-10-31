(function () {
  var raw = "$API_BASE";
  var isPlaceholder = !raw || raw.trim().length === 0 || raw.startsWith("$");
  var apiBase = isPlaceholder ? undefined : raw;
  var existing = globalThis.__APP_CONFIG__ ?? {};

  globalThis.__APP_CONFIG__ = {
    ...existing,
    apiBase
  };
})();
