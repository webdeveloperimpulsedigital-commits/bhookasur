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
  // Automatically encode raw spaces to %20 to prevent iOS Safari AVPlayer media parse failures
  const encodedPath = path.replace(/ /g, '%20');
  if (
    encodedPath.startsWith('http://') ||
    encodedPath.startsWith('https://') ||
    encodedPath.startsWith('data:') ||
    encodedPath.startsWith('blob:')
  ) {
    return encodedPath;
  }
  if (!BASE_PATH) return encodedPath;
  if (encodedPath.startsWith(BASE_PATH + '/') || encodedPath === BASE_PATH) {
    return encodedPath;
  }
  const cleanPath = encodedPath.startsWith('/') ? encodedPath : `/${encodedPath}`;
  return `${BASE_PATH}${cleanPath}`;
}
