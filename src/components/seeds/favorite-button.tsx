'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface FavoriteButtonProps {
  seedId: string
  initialValue: boolean
  onToggle?: (newValue: boolean) => void
}

export function FavoriteButton({ seedId, initialValue, onToggle }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialValue)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isUpdating) return

    const newValue = !isFavorite
    setIsFavorite(newValue) // Optimistic update
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/seeds/${seedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: newValue }),
      })

      if (!response.ok) {
        // Rollback on error
        setIsFavorite(!newValue)
      } else {
        onToggle?.(newValue)
      }
    } catch {
      // Rollback on error
      setIsFavorite(!newValue)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className={`
        pointer-events-auto rounded-full p-2 transition-all duration-200
        ${isFavorite
          ? 'bg-[var(--color-terracotta-light)]/80 text-[var(--color-terracotta-dark)]'
          : 'bg-[var(--color-warm-white)]/90 text-[var(--color-branch)] hover:text-[var(--color-terracotta)]'
        }
        ${isUpdating ? 'opacity-50 cursor-wait' : 'hover:scale-110'}
        backdrop-blur-sm
      `}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star className={`h-4 w-4 transition-transform ${isFavorite ? 'fill-current scale-110' : ''}`} />
    </button>
  )
}
