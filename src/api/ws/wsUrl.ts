export function getWsUrl() {
  const baseUrl = import.meta.env.VITE_BASE_API_URL || window.location.origin;
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}
