/**
 * Sites that have issues with automated scraping.
 * Some can be worked around by pasting HTML source, others cannot.
 */

interface BlockedSite {
  domain: string
  name: string
  reason: string
  /** If true, user can paste HTML source as a workaround */
  supportsHtmlPaste: boolean
}

const BLOCKED_SITES: BlockedSite[] = [
  {
    domain: 'seedsavers.org',
    name: 'Seed Savers Exchange',
    reason: 'Uses a JavaScript-based storefront that prevents automated data extraction',
    supportsHtmlPaste: false, // JS-rendered, view source won't help
  },
  {
    domain: 'shop.seedsavers.org',
    name: 'Seed Savers Exchange',
    reason: 'Uses a JavaScript-based storefront that prevents automated data extraction',
    supportsHtmlPaste: false,
  },
  {
    domain: 'rareseeds.com',
    name: 'Baker Creek Heirloom Seeds',
    reason: 'Has bot protection that blocks automated requests',
    supportsHtmlPaste: true, // Content is in HTML, just can't fetch it
  },
  {
    domain: 'southernexposure.com',
    name: 'Southern Exposure Seed Exchange',
    reason: 'Uses a JavaScript single-page app that prevents automated data extraction',
    supportsHtmlPaste: false, // SPA - content not in HTML source
  },
]

/**
 * Check if a URL is from a blocked site
 * Returns the blocked site info if blocked, null otherwise
 */
export function checkBlockedSite(url: string): BlockedSite | null {
  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.toLowerCase()

    for (const site of BLOCKED_SITES) {
      if (hostname === site.domain || hostname.endsWith('.' + site.domain)) {
        return site
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Get a user-friendly error message for a blocked site
 */
export function getBlockedSiteMessage(site: BlockedSite): string {
  return `${site.name} isn't compatible with automatic import. ${site.reason}. Please enter the seed details manually.`
}
