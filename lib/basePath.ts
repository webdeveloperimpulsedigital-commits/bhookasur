/**
 * Base path configuration for Hostinger / production sub-path hosting.
 * Default: '/bhookasur_ka_food_tour' (e.g. https://gastrium.in/bhookasur_ka_food_tour)
 */
export const BASE_PATH = (
  process.env.NEXT_PUBLIC_BASE_PATH !== undefined
    ? process.env.NEXT_PUBLIC_BASE_PATH
    : '/bhookasur_ka_food_tour'
).replace(/\/+$/, ''); // Strip any trailing slashes

/**
 * Prepends BASE_PATH to a relative path (e.g. '/images/...' or '/api/...').
 * Leaves absolute URLs, data URIs, and already-prefixed paths intact.
 */
export function withBasePath(path: string): string {
  if (!path) return path;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  if (!BASE_PATH) return path;
  if (path.startsWith(BASE_PATH + '/') || path === BASE_PATH) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${cleanPath}`;
}
