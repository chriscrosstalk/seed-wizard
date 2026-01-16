'use client'

import { useState } from 'react'
import { Check, Sprout } from 'lucide-react'

interface PlantedCheckboxProps {
  seedId: string
  initialValue: boolean
  onToggle?: (newValue: boolean) => void
}

export function PlantedCheckbox({ seedId, initialValue, onToggle }: PlantedCheckboxProps) {
  const [isPlanted, setIsPlanted] = useState(initialValue)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isUpdating) return

    const newValue = !isPlanted
    setIsPlanted(newValue) // Optimistic update
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/seeds/${seedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_planted: newValue }),
      })

      if (!response.ok) {
        // Rollback on error
        setIsPlanted(!newValue)
      } else {
        onToggle?.(newValue)
      }
    } catch {
      // Rollback on error
      setIsPlanted(!newValue)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className={`
        pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5
        text-xs font-medium transition-all duration-200
        ${isPlanted
          ? 'bg-[var(--color-sage-light)]/60 text-[var(--color-sage-dark)] border border-[var(--color-sage)]'
          : 'bg-transparent text-[var(--color-branch)] border border-[var(--color-parchment)] hover:border-[var(--color-sage-light)] hover:text-[var(--color-sage-dark)]'
        }
        ${isUpdating ? 'opacity-50 cursor-wait' : ''}
      `}
    >
      <span
        className={`
          flex h-4 w-4 items-center justify-center rounded-full transition-all duration-200
          ${isPlanted
            ? 'bg-[var(--color-sage)] text-white'
            : 'border border-current'
          }
        `}
      >
        {isPlanted ? (
          <Check className="h-3 w-3" />
        ) : (
          <Sprout className="h-2.5 w-2.5 opacity-50" />
        )}
      </span>
      <span>{isPlanted ? 'Planted' : 'Mark planted'}</span>
    </button>
  )
}
