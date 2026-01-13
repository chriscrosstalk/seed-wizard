/**
 * Fetches and cleans HTML content from a seed company product page
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; SeedWizard/1.0; +https://seedwizard.app)'
const MAX_CONTENT_LENGTH = 15000 // ~15k chars to stay within token limits

export async function fetchPageContent(url: string): Promise<string> {
  // Validate URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('Invalid URL format')
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('URL must use HTTP or HTTPS protocol')
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch page: HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
    throw new Error('URL must point to an HTML page')
  }

  const html = await response.text()
  return cleanHtmlContent(html)
}

/**
 * Strips unnecessary HTML and extracts readable text content
 */
function cleanHtmlContent(html: string): string {
  let content = html

  // Remove script and style tags with their content
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  content = content.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')

  // Remove common non-product elements
  content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
  content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
  content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
  content = content.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')

  // Remove comments
  content = content.replace(/<!--[\s\S]*?-->/g, '')

  // Remove common ad/tracking elements
  content = content.replace(/<div[^>]*(?:id|class)=["'][^"']*(?:cookie|banner|popup|modal|newsletter|subscribe|ad-|ads-|advertising)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')

  // Convert important HTML elements to readable format
  content = content.replace(/<h[1-6][^>]*>/gi, '\n\n### ')
  content = content.replace(/<\/h[1-6]>/gi, '\n')
  content = content.replace(/<li[^>]*>/gi, '\n- ')
  content = content.replace(/<\/li>/gi, '')
  content = content.replace(/<br\s*\/?>/gi, '\n')
  content = content.replace(/<p[^>]*>/gi, '\n')
  content = content.replace(/<\/p>/gi, '\n')
  content = content.replace(/<tr[^>]*>/gi, '\n')
  content = content.replace(/<td[^>]*>/gi, ' | ')
  content = content.replace(/<th[^>]*>/gi, ' | ')

  // Remove remaining HTML tags
  content = content.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  content = decodeHtmlEntities(content)

  // Clean up whitespace
  content = content.replace(/\s+/g, ' ')
  content = content.replace(/\n\s+/g, '\n')
  content = content.replace(/\n{3,}/g, '\n\n')
  content = content.trim()

  // Truncate if too long
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.substring(0, MAX_CONTENT_LENGTH)
    // Try to cut at a sentence boundary
    const lastPeriod = content.lastIndexOf('.')
    if (lastPeriod > MAX_CONTENT_LENGTH * 0.8) {
      content = content.substring(0, lastPeriod + 1)
    }
    content += '\n\n[Content truncated]'
  }

  return content
}

/**
 * Decodes common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&deg;': '°',
    '&ndash;': '–',
    '&mdash;': '—',
    '&frac14;': '¼',
    '&frac12;': '½',
    '&frac34;': '¾',
    '&reg;': '®',
    '&trade;': '™',
    '&copy;': '©',
  }

  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'gi'), char)
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  )
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  )

  return result
}
