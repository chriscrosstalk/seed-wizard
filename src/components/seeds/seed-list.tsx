'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SeedCard } from './seed-card'
import type { Seed } from '@/types/database'

interface SeedListProps {
  seeds: Seed[]
}

export function SeedList({ seeds }: SeedListProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this seed?')) {
      return
    }

    setDeleting(id)
    try {
      const res = await fetch(`/api/seeds/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Failed to delete seed')
      }
    } catch {
      alert('Failed to delete seed')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {seeds.map((seed) => (
        <SeedCard
          key={seed.id}
          seed={seed}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
