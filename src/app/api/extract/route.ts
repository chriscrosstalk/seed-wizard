import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchPageContent } from '@/lib/scraper/fetch-page'
import { extractSeedData } from '@/lib/claude/extract-seed-data'

const requestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
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

  const { url } = result.data

  try {
    // Fetch and clean page content
    const pageContent = await fetchPageContent(url)

    if (!pageContent || pageContent.length < 100) {
      return NextResponse.json(
        { error: 'Page content too short or empty. Make sure the URL points to a seed product page.' },
        { status: 400 }
      )
    }

    // Extract seed data using Claude
    const extractedData = await extractSeedData(pageContent, url)

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
