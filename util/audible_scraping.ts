import { regionMap } from '../app';

/**
 * Generates a random cookie string with session information
 * @returns {string} Random cookie string
 */
export function generateRandomCookie(): string {
  // session ID (format: XXX-XXXXXXX-XXXXXXX)
  const generateSessionId = () => {
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(1000000 + Math.random() * 9000000);
    const part3 = Math.floor(1000000 + Math.random() * 9000000);
    return `${part1}-${part2}-${part3}`;
  };

  const generateSessionTime = () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const randomOffset = Math.floor(10 + Math.random() * 21);
    return `${currentTime - randomOffset}l`;
  };

  // i18n preferences
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
  const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];

  const cookieParts = [
    `session-id=${generateSessionId()}`,
    `session-id-time=${generateSessionTime()}`,
    `i18n-prefs=${randomCurrency}`,
    `ubid-acbde=${generateSessionId()}`,
    'ipRedirectOverride=true',
  ];

  return cookieParts.join('; ');
}

/**
 * Generates headers for scraping Audible
 * @param region
 */
export function generateScrapingHeaders(region: string) {
  // Random number between 129 and 134
  const randomChromeVersion = Math.floor(129 + Math.random() * 6);
  const randomViewportWidth = Math.floor((920 + Math.random() * 1001) / 2) * 2;

  return {
    'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomChromeVersion}.0.0.0 Safari/537.36`,
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate, br, zstd',
    host: `audible${regionMap[region.toLowerCase()]}`,
    'sec-ch-ua': `"Chromium";v="${randomChromeVersion}", "Not:A-Brand";v="24", "Google Chrome";v="${randomChromeVersion}"`,
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    Cookie: generateRandomCookie(),
    'viewport-width': randomViewportWidth.toString(),
  };
}
