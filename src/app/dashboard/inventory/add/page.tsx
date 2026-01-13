import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SeedForm } from '@/components/seeds/seed-form'

export default function AddSeedPage() {
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
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add New Seed</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new seed to your inventory. You can import data from a product URL later.
        </p>
      </div>

      <SeedForm mode="create" />
    </div>
  )
}
