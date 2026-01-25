'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2, ExternalLink, Droplets, Sun, Clock, Leaf } from 'lucide-react'
import type { Seed } from '@/types/database'
import type { CategoryFilter } from './seed-list'
import { FavoriteButton } from './favorite-button'
import { PlantedCheckbox } from './planted-checkbox'

interface SeedCardProps {
  seed: Seed
  category?: CategoryFilter
  variant?: 'default' | 'featured'
  onDelete?: (id: string) => void
  onFavoriteChange?: (id: string, value: boolean) => void
  onPlantedChange?: (id: string, value: boolean) => void
}

const categoryStyles: Record<CategoryFilter, {
  accent: string
  accentLight: string
  accentDark: string
  badge: string
  label: string
}> = {
  vegetable: {
    accent: 'var(--color-sky-soft)',
    accentLight: 'var(--color-sky-soft)',
    accentDark: 'var(--color-sky-muted)',
    badge: 'bg-[var(--color-sky-soft)]/30 text-[var(--color-bark)]',
    label: 'Vegetable',
  },
  flower: {
    accent: 'var(--color-rose-soft)',
    accentLight: 'var(--color-rose-soft)',
    accentDark: 'var(--color-rose-muted)',
    badge: 'bg-[var(--color-rose-soft)]/30 text-[var(--color-bark)]',
    label: 'Flower',
  },
  herb: {
    accent: 'var(--color-herb-green)',
    accentLight: 'var(--color-herb-light)',
    accentDark: 'var(--color-herb-green)',
    badge: 'bg-[var(--color-herb-light)] text-[var(--color-bark)]',
    label: 'Herb',
  },
}

// Get year badge styles based on seed age
function getYearBadgeStyles(purchaseYear: number): { bg: string; text: string } {
  const currentYear = new Date().getFullYear()
  const age = currentYear - purchaseYear

  if (age <= 0) {
    // Current year - green
    return {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
    }
  } else if (age === 1) {
    // 1 year old - yellow
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
    }
  } else if (age === 2) {
    // 2 years old - orange
    return {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
    }
  } else {
    // 3+ years old - red
    return {
      bg: 'bg-red-100',
      text: 'text-red-700',
    }
  }
}

// Decorative botanical corner SVG
function BotanicalCorner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 2C2 2 8 8 20 8C32 8 38 2 38 2"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M2 8C2 8 10 14 20 14C30 14 38 8 38 8"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.2"
      />
      <circle cx="20" cy="4" r="2" fill="currentColor" opacity="0.2" />
    </svg>
  )
}

export function SeedCard({
  seed,
  category = 'vegetable',
  variant = 'default',
  onDelete,
  onFavoriteChange,
  onPlantedChange,
}: SeedCardProps) {
  const maturityText = seed.days_to_maturity_min
    ? seed.days_to_maturity_max && seed.days_to_maturity_max !== seed.days_to_maturity_min
      ? `${seed.days_to_maturity_min}-${seed.days_to_maturity_max}`
      : `${seed.days_to_maturity_min}`
    : null

  const styles = categoryStyles[category]
  const isFeatured = variant === 'featured'

  // Planting timing text
  const getTimingText = () => {
    if (seed.planting_method === 'start_indoors') {
      const weeks = seed.weeks_before_last_frost
      if (weeks) return `Start indoors ${weeks}w before last frost`
    }
    if (seed.planting_method === 'direct_sow') {
      if (seed.cold_hardy && seed.weeks_before_last_frost_outdoor) {
        return `Direct sow ${seed.weeks_before_last_frost_outdoor}w before last frost`
      }
      if (!seed.cold_hardy && seed.weeks_after_last_frost != null) {
        return `Direct sow ${seed.weeks_after_last_frost}w after last frost`
      }
      return seed.cold_hardy ? 'Direct sow (cold hardy)' : 'Direct sow'
    }
    return null
  }

  const timingText = getTimingText()

  return (
    <article
      className={`
        group relative overflow-hidden rounded-xl bg-[var(--color-warm-white)] paper-texture
        transition-all duration-300 ease-[var(--transition-smooth)]
        hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1
        ${isFeatured ? 'shadow-[var(--shadow-card-hover)]' : 'shadow-[var(--shadow-card)]'}
      `}
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `color-mix(in srgb, ${styles.accent} 40%, transparent)`,
      }}
    >
      {/* Decorative corner accents */}
      <BotanicalCorner
        className="absolute top-0 left-1/2 -translate-x-1/2 text-[var(--color-branch)] opacity-60"
      />

      {/* Clickable overlay */}
      <Link
        href={`/dashboard/inventory/${seed.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Edit ${seed.variety_name}`}
      />

      <div className="relative z-10 pointer-events-none">
        {/* Image Section */}
        {seed.image_url ? (
          <div className={`relative overflow-hidden ${isFeatured ? 'h-56' : 'h-44'}`}>
            <Image
              src={seed.image_url}
              alt={seed.variety_name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes={isFeatured ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, 33vw'}
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-soil)]/60 via-transparent to-transparent" />

            {/* Floating action buttons on image */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <FavoriteButton
                seedId={seed.id}
                initialValue={seed.is_favorite}
                onToggle={(value) => onFavoriteChange?.(seed.id, value)}
              />
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(seed.id)
                  }}
                  className="pointer-events-auto rounded-full bg-[var(--color-warm-white)]/90 p-2
                             text-[var(--color-bark)] opacity-0 group-hover:opacity-100
                             transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category badge on image */}
            <div className="absolute top-3 left-3">
              <span className={`
                inline-flex items-center gap-1 rounded-full px-2.5 py-1
                text-xs font-medium backdrop-blur-sm
                bg-[var(--color-warm-white)]/90 text-[var(--color-bark)]
              `}>
                <Leaf className="h-3 w-3" style={{ color: styles.accentDark }} />
                {styles.label}
              </span>
            </div>

            {/* Title overlay on image */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className={`
                font-[var(--font-display)] font-bold text-white
                ${isFeatured ? 'text-2xl' : 'text-lg'}
                leading-tight drop-shadow-md
              `}>
                {seed.variety_name}
              </h3>
              {seed.common_name && (
                <p className="text-white/80 text-sm mt-0.5 italic drop-shadow">
                  {seed.common_name}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* No image placeholder */
          <div
            className={`
              relative ${isFeatured ? 'h-40' : 'h-32'} flex items-center justify-center
            `}
            style={{
              background: `linear-gradient(135deg, ${styles.accentLight}40, ${styles.accentLight}20)`,
            }}
          >
            {/* Decorative plant silhouette */}
            <svg
              className="h-16 w-16 opacity-20"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: styles.accentDark }}
            >
              <path d="M12 22c-4.97 0-9-4.03-9-9 0-3.87 2.63-7.09 6.15-8.36C9.06 4.44 9 4.22 9 4c0-1.66 1.34-3 3-3s3 1.34 3 3c0 .22-.06.44-.15.64C18.37 5.91 21 9.13 21 13c0 4.97-4.03 9-9 9z" />
            </svg>

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <FavoriteButton
                seedId={seed.id}
                initialValue={seed.is_favorite}
                onToggle={(value) => onFavoriteChange?.(seed.id, value)}
              />
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(seed.id)
                  }}
                  className="pointer-events-auto rounded-full bg-[var(--color-warm-white)]/90 p-2
                             text-[var(--color-bark)] opacity-0 group-hover:opacity-100
                             transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category badge */}
            <div className="absolute top-3 left-3">
              <span className={`
                inline-flex items-center gap-1 rounded-full px-2.5 py-1
                text-xs font-medium ${styles.badge}
              `}>
                <Leaf className="h-3 w-3" />
                {styles.label}
              </span>
            </div>

            {/* Title for no-image cards */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className={`
                font-[var(--font-display)] font-bold text-[var(--color-soil)]
                ${isFeatured ? 'text-2xl' : 'text-lg'}
                leading-tight
              `}>
                {seed.variety_name}
              </h3>
              {seed.common_name && (
                <p className="text-[var(--color-bark)] text-sm mt-0.5 italic">
                  {seed.common_name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className={`p-4 ${isFeatured ? 'p-5' : ''}`}>
          {/* Meta tags row */}
          <div className="flex flex-wrap gap-2 mb-3">
            {seed.seed_company && (
              <span className="inline-flex items-center rounded-md bg-[var(--color-parchment)] px-2 py-1 text-xs font-medium text-[var(--color-bark)]">
                {seed.seed_company}
              </span>
            )}
            {seed.purchase_year && (() => {
              const yearStyles = getYearBadgeStyles(seed.purchase_year)
              return (
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${yearStyles.bg} ${yearStyles.text}`}>
                  {seed.purchase_year}
                </span>
              )
            })()}
            {seed.quantity_packets > 1 && (
              <span className="inline-flex items-center rounded-md bg-[var(--color-sage-light)]/50 px-2 py-1 text-xs font-medium text-[var(--color-sage-dark)]">
                {seed.quantity_packets} packets
              </span>
            )}
          </div>

          {/* Growing info */}
          <div className="space-y-2 text-sm text-[var(--color-bark)]">
            {/* Maturity and requirements row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {maturityText && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[var(--color-branch)]" />
                  <span>{maturityText} days</span>
                </span>
              )}
              {seed.sun_requirement && (
                <span className="inline-flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-[var(--color-terracotta)]" />
                  <span className="capitalize">{seed.sun_requirement.replace('_', ' ')}</span>
                </span>
              )}
              {seed.water_requirement && (
                <span className="inline-flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-[var(--color-sky-muted)]" />
                  <span className="capitalize">{seed.water_requirement}</span>
                </span>
              )}
            </div>

            {/* Planting timing */}
            {timingText && (
              <p className="text-xs text-[var(--color-branch)] italic">
                {timingText}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="my-3 h-px bg-[var(--color-parchment)]" />

          {/* Bottom row: planted status and link */}
          <div className="flex items-center justify-between">
            <PlantedCheckbox
              seedId={seed.id}
              initialValue={seed.is_planted}
              onToggle={(value) => onPlantedChange?.(seed.id, value)}
            />

            {seed.product_url && (
              <a
                href={seed.product_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto inline-flex items-center gap-1 text-xs
                           text-[var(--color-sage-dark)] hover:text-[var(--color-sage)]
                           transition-colors duration-200"
              >
                <ExternalLink className="h-3 w-3" />
                View product
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
