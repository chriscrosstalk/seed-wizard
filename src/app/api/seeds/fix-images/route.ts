import { NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'
import { seeds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { fetchPageContent } from '@/lib/scraper/fetch-page'
import { extractSeedData } from '@/lib/claude/extract-seed-data'

// Initialize database on first request
initializeDatabase()

type SeedForImageFix = {
  id: string
  variety_name: string
  product_url: string | null
  image_url: string | null
}

// POST /api/seeds/fix-images - Re-extract image URLs for seeds missing them
export async function POST() {
  try {
    // First, let's see all seeds and their image_url status
    const allSeeds = await db
      .select({
        id: seeds.id,
        variety_name: seeds.variety_name,
        product_url: seeds.product_url,
        image_url: seeds.image_url,
      })
      .from(seeds) as SeedForImageFix[]

    // Filter for seeds that have a product_url but missing/empty image_url
    const affectedSeeds = allSeeds.filter(seed =>
      seed.product_url && (!seed.image_url || seed.image_url.trim() === '')
    )

    // Debug: show all seeds' image_url status
    const debugInfo = allSeeds.map(s => ({
      name: s.variety_name,
      hasProductUrl: !!s.product_url,
      imageUrl: s.image_url,
      imageUrlType: typeof s.image_url,
      needsFix: s.product_url && (!s.image_url || s.image_url.trim() === '')
    }))

    const seedsToFix = affectedSeeds

    if (seedsToFix.length === 0) {
      return NextResponse.json({ message: 'No seeds need fixing', fixed: 0, debug: debugInfo })
    }

    const results: { id: string; name: string; status: string; image_url?: string }[] = []

    for (const seed of seedsToFix) {
      try {
        if (!seed.product_url) {
          results.push({ id: seed.id, name: seed.variety_name, status: 'skipped - no product_url' })
          continue
        }

        // Fetch page content
        const pageContent = await fetchPageContent(seed.product_url)

        if (!pageContent || pageContent.length < 100) {
          results.push({ id: seed.id, name: seed.variety_name, status: 'failed - page content too short' })
          continue
        }

        // Extract seed data
        const extractedData = await extractSeedData(pageContent, seed.product_url)

        if (!extractedData.image_url) {
          results.push({ id: seed.id, name: seed.variety_name, status: 'failed - no image found on page' })
          continue
        }

        // Update just the image_url
        await db
          .update(seeds)
          .set({ image_url: extractedData.image_url })
          .where(eq(seeds.id, seed.id))

        results.push({
          id: seed.id,
          name: seed.variety_name,
          status: 'fixed',
          image_url: extractedData.image_url
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        results.push({ id: seed.id, name: seed.variety_name, status: `error - ${message}` })
      }
    }

    const fixed = results.filter(r => r.status === 'fixed').length

    return NextResponse.json({
      message: `Fixed ${fixed} of ${seedsToFix.length} seeds`,
      fixed,
      total: seedsToFix.length,
      results
    })
  } catch (error) {
    console.error('Error fixing images:', error)
    return NextResponse.json({ error: 'Failed to fix images' }, { status: 500 })
  }
}
