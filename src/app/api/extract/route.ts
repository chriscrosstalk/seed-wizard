import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchPageContent, cleanHtmlContent } from '@/lib/scraper/fetch-page'
import { extractSeedData } from '@/lib/claude/extract-seed-data'
import { checkBlockedSite, getBlockedSiteMessage } from '@/lib/scraper/blocked-sites'

const requestSchema = z.object({
  url: z.string().url('Please provide a valid URL').optional(),
  html: z.string().min(100, 'HTML content is too short').optional(),
}).refine(data => data.url || data.html, {
  message: 'Either url or html must be provided',
})

// POST /api/extract - Extract seed data from a product URL
export async function POST(request: NextRequest) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate input
  const result = requestSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { url, html } = result.data

  // If HTML is provided directly, process it
  if (html) {
    try {
      const pageContent = cleanHtmlContent(html)

      if (!pageContent || pageContent.length < 100) {
        return NextResponse.json(
          { error: 'HTML content too short or empty. Make sure you copied the full page source.' },
          { status: 400 }
        )
      }

      // Extract seed data using Claude
      const extractedData = await extractSeedData(pageContent, url || undefined)

      // Validate that this is actually a seed product page
      if (!extractedData.is_seed_product_page) {
        return NextResponse.json(
          { error: 'This doesn\'t appear to be a seed product page. Please provide a URL to a seed, plant, or bulb product listing.' },
          { status: 400 }
        )
      }

      // Check that we got meaningful data beyond just variety_name
      const hasMeaningfulData = extractedData.variety_name && (
        extractedData.common_name ||
        extractedData.days_to_maturity_min ||
        extractedData.planting_method ||
        extractedData.planting_depth_inches ||
        extractedData.spacing_inches
      )

      if (!hasMeaningfulData) {
        return NextResponse.json(
          { error: 'Could not extract enough seed information from this page. Please make sure the URL is for a seed product with planting details.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        ...extractedData,
        product_url: url || null,
        ai_extracted: true,
      })
    } catch (error) {
      console.error('HTML extraction error:', error)
      return NextResponse.json(
        { error: 'Failed to extract seed data from HTML. Please try again or enter data manually.' },
        { status: 500 }
      )
    }
  }

  // URL-based extraction
  if (!url) {
    return NextResponse.json(
      { error: 'Please provide a URL or paste HTML content.' },
      { status: 400 }
    )
  }

  // Check if URL is from a blocked site
  const blockedSite = checkBlockedSite(url)
  if (blockedSite) {
    return NextResponse.json(
      {
        error: getBlockedSiteMessage(blockedSite),
        blocked: true,
        supportsHtmlPaste: blockedSite.supportsHtmlPaste,
      },
      { status: 400 }
    )
  }

  try {
    // Fetch and clean page content
    const pageContent = await fetchPageContent(url)

    if (!pageContent || pageContent.length < 100) {
      return NextResponse.json(
        { error: 'Page content too short or empty. Make sure the content is from a seed product page.' },
        { status: 400 }
      )
    }

    // Extract seed data using Claude
    const extractedData = await extractSeedData(pageContent, url)

    // Validate that this is actually a seed product page
    if (!extractedData.is_seed_product_page) {
      return NextResponse.json(
        { error: 'This doesn\'t appear to be a seed product page. Please provide a URL to a seed, plant, or bulb product listing.' },
        { status: 400 }
      )
    }

    // Check that we got meaningful data beyond just variety_name
    const hasMeaningfulData = extractedData.variety_name && (
      extractedData.common_name ||
      extractedData.days_to_maturity_min ||
      extractedData.planting_method ||
      extractedData.planting_depth_inches ||
      extractedData.spacing_inches
    )

    if (!hasMeaningfulData) {
      return NextResponse.json(
        { error: 'Could not extract enough seed information from this page. Please make sure the URL is for a seed product with planting details.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ...extractedData,
      product_url: url,
      ai_extracted: true,
    })
  } catch (error) {
    console.error('Extraction error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return NextResponse.json(
          { error: 'Could not fetch the page. Please check the URL and try again.' },
          { status: 400 }
        )
      }
      if (error.message.includes('Invalid URL')) {
        return NextResponse.json(
          { error: 'Invalid URL format. Please provide a valid seed product URL.' },
          { status: 400 }
        )
      }
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          { error: 'AI extraction is not configured. Please contact support.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to extract seed data. Please try again or enter data manually.' },
      { status: 500 }
    )
  }
}
