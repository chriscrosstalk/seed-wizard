import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchPageContent } from '@/lib/scraper/fetch-page'
import { extractSeedData } from '@/lib/claude/extract-seed-data'
import type { Seed } from '@/types/database'

// POST /api/seeds/fix-images - Re-extract image URLs for seeds missing them
export async function POST() {
  const supabase = await createClient()

  // First, let's see all seeds and their image_url status
  const { data: allSeeds, error: fetchError } = await supabase
    .from('seeds')
    .select('id, variety_name, product_url, image_url')

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Filter for seeds that have a product_url but missing/empty image_url
  const affectedSeeds = (allSeeds || []).filter(seed =>
    seed.product_url && (!seed.image_url || seed.image_url.trim() === '')
  )

  // Debug: show all seeds' image_url status
  const debugInfo = (allSeeds || []).map(s => ({
    name: s.variety_name,
    hasProductUrl: !!s.product_url,
    imageUrl: s.image_url,
    imageUrlType: typeof s.image_url,
    needsFix: s.product_url && (!s.image_url || s.image_url.trim() === '')
  }))

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const seeds = affectedSeeds as Seed[]

  if (seeds.length === 0) {
    return NextResponse.json({ message: 'No seeds need fixing', fixed: 0, debug: debugInfo })
  }

  const results: { id: string; name: string; status: string; image_url?: string }[] = []

  for (const seed of seeds) {
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
      const { error: updateError } = await supabase
        .from('seeds')
        .update({ image_url: extractedData.image_url })
        .eq('id', seed.id)

      if (updateError) {
        results.push({ id: seed.id, name: seed.variety_name, status: `failed - ${updateError.message}` })
        continue
      }

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
    message: `Fixed ${fixed} of ${seeds.length} seeds`,
    fixed,
    total: seeds.length,
    results
  })
}
