/**
 * FingerprintJS integration module
 * Uses the open-source version for visitor identification
 * Used for duplicate welcome credit prevention
 */

let fpPromise = null;
let cachedVisitorId = null;

/**
 * Initialize FingerprintJS and get visitor ID
 * @returns {Promise<string|null>} Visitor ID or null if failed
 */
export async function getVisitorId() {
  // Return cached value if available
  if (cachedVisitorId) {
    return cachedVisitorId;
  }

  try {
    // Load FingerprintJS from CDN if not already loaded
    if (!fpPromise) {
      fpPromise = loadFingerprintJS();
    }

    const fp = await fpPromise;
    const result = await fp.get();
    cachedVisitorId = result.visitorId;
    return cachedVisitorId;
  } catch (error) {
    console.error('[Fingerprint] Error getting visitor ID:', error);
    return null;
  }
}

/**
 * Load FingerprintJS from CDN
 * @returns {Promise} FingerprintJS agent
 */
async function loadFingerprintJS() {
  // Check if already loaded
  if (window.FingerprintJS) {
    return window.FingerprintJS.load();
  }

  // Load from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@4/dist/fp.min.js';
    script.async = true;
    script.onload = async () => {
      try {
        const fp = await window.FingerprintJS.load();
        resolve(fp);
      } catch (err) {
        reject(err);
      }
    };
    script.onerror = () => reject(new Error('Failed to load FingerprintJS'));
    document.head.appendChild(script);
  });
}

/**
 * Clear cached visitor ID (for testing)
 */
export function clearCache() {
  cachedVisitorId = null;
}
