import Link from 'next/link'
import { MoreVertical, Pencil, Trash2, ExternalLink } from 'lucide-react'
import type { Seed } from '@/types/database'

interface SeedCardProps {
  seed: Seed
  onDelete?: (id: string) => void
}

export function SeedCard({ seed, onDelete }: SeedCardProps) {
  const maturityText = seed.days_to_maturity_min
    ? seed.days_to_maturity_max && seed.days_to_maturity_max !== seed.days_to_maturity_min
      ? `${seed.days_to_maturity_min}-${seed.days_to_maturity_max} days`
      : `${seed.days_to_maturity_min} days`
    : null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{seed.variety_name}</h3>
          {seed.common_name && (
            <p className="text-sm text-gray-500">{seed.common_name}</p>
          )}
        </div>

        {/* Actions dropdown placeholder - will be interactive later */}
        <div className="flex gap-1">
          <Link
            href={`/dashboard/inventory/${seed.id}`}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(seed.id)}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {seed.seed_company && (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
            {seed.seed_company}
          </span>
        )}
        {seed.purchase_year && (
          <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
            {seed.purchase_year}
          </span>
        )}
        {maturityText && (
          <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
            {maturityText}
          </span>
        )}
        {seed.quantity_packets > 1 && (
          <span className="rounded-full bg-purple-50 px-2 py-1 text-purple-700">
            {seed.quantity_packets} packets
          </span>
        )}
      </div>

      {seed.planting_method && (
        <div className="mt-3 text-xs text-gray-500">
          {seed.planting_method === 'start_indoors' && 'Start indoors'}
          {seed.planting_method === 'direct_sow' && 'Direct sow'}
          {seed.planting_method === 'both' && 'Start indoors or direct sow'}
          {seed.weeks_before_last_frost && seed.planting_method !== 'direct_sow' && (
            <span> • {seed.weeks_before_last_frost}w before last frost</span>
          )}
        </div>
      )}

      {seed.product_url && (
        <a
          href={seed.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Product page
        </a>
      )}
    </div>
  )
}
