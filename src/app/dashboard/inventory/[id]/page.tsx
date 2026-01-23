import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/inventory"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inventory
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Seed</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update the details for {seed.variety_name}
        </p>
      </div>

      <SeedForm mode="edit" initialData={seed} />
    </div>
  )
}
