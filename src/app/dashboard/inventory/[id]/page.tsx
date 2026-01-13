import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SeedForm } from '@/components/seeds/seed-form'

interface EditSeedPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSeedPage({ params }: EditSeedPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: seed, error } = await supabase
    .from('seeds')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !seed) {
    notFound()
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
