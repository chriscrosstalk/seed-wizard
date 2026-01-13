'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

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
    <label
      className={`pointer-events-auto inline-flex items-center gap-1.5 cursor-pointer select-none ${
        isUpdating ? 'opacity-50' : ''
      }`}
      onClick={handleClick}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
          isPlanted
            ? 'border-green-600 bg-green-600 text-white'
            : 'border-gray-300 bg-white hover:border-green-400'
        }`}
      >
        {isPlanted && <Check className="h-3 w-3" />}
      </span>
      <span className={`text-xs ${isPlanted ? 'text-green-700' : 'text-gray-500'}`}>
        Planted
      </span>
    </label>
  )
}
