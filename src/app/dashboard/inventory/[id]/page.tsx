import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { db, initializeDatabase } from '@/lib/db'
import { seeds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SeedForm } from '@/components/seeds/seed-form'
import type { Seed } from '@/types/database'

// Initialize database
initializeDatabase()

interface EditSeedPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSeedPage({ params }: EditSeedPageProps) {
  const { id } = await params

  const [data] = await db.select().from(seeds).where(eq(seeds.id, id))

  if (!data) {
    notFound()
  }

  const seed: Seed = {
    ...data,
    raw_ai_response: data.raw_ai_response ? JSON.parse(data.raw_ai_response) : null,
  }

  // Ensure https for image URLs
  const imageUrl = seed.image_url?.replace(/^http:\/\//i, 'https://') || null

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/inventory"
          className="flex items-center gap-1 text-sm text-[var(--color-branch)] hover:text-[var(--color-soil)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inventory
        </Link>
      </div>

      {/* Seed Header with Image */}
      <div className="mb-8 rounded-xl border border-[var(--color-parchment)] bg-[var(--color-warm-white)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Image */}
          {imageUrl && (
            <div className="flex-shrink-0">
              <div className="relative h-48 w-48 overflow-hidden rounded-lg border border-[var(--color-parchment)] bg-[var(--color-cream)] shadow-sm">
                <Image
                  src={imageUrl}
                  alt={seed.variety_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* Seed Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--color-soil)]">
              {seed.variety_name}
            </h1>
            {seed.common_name && (
              <p className="mt-1 text-lg text-[var(--color-branch)]">
                {seed.common_name}
              </p>
            )}
            {seed.seed_company && (
              <p className="mt-2 text-sm text-[var(--color-branch)]">
                From {seed.seed_company}
              </p>
            )}
            {seed.product_url && (
              <a
                href={seed.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-sage)] hover:text-[var(--color-sage-dark)] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View product page
              </a>
            )}
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-[var(--color-bark)]">
        Edit Seed Details
      </h2>

      <SeedForm mode="edit" initialData={seed} />
    </div>
  )
}
