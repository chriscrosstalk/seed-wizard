'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2, ExternalLink } from 'lucide-react'
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
    <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden group">
      {/* Clickable overlay for entire card */}
      <Link
        href={`/dashboard/inventory/${seed.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Edit ${seed.variety_name}`}
      />

      <div className="relative z-10 p-4 pointer-events-none">
        <div className="flex gap-4">
          {/* Thumbnail */}
          {seed.image_url && (
            <div className="flex-shrink-0">
              <div className="relative h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                <Image
                  src={seed.image_url}
                  alt={seed.variety_name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {seed.variety_name}
                </h3>
                {seed.common_name && (
                  <p className="text-sm text-gray-500 truncate">{seed.common_name}</p>
                )}
              </div>

              {/* Delete button - needs pointer-events */}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(seed.id)
                  }}
                  className="pointer-events-auto rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
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
              <div className="mt-2 text-xs text-gray-500">
                {seed.planting_method === 'start_indoors' && 'Start indoors'}
                {seed.planting_method === 'direct_sow' && 'Direct sow'}
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
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Product page
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
