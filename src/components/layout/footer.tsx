'use client'

import { useEffect, useState } from 'react'
import { parseLocalDate } from '@/lib/planting-window'
import packageJson from '../../../package.json'

interface ProfileData {
  hardiness_zone: string | null
  last_frost_date: string | null
}

export function Footer() {
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => setProfile(data))
      .catch(() => setProfile(null))
  }, [])

  const formatFrostDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = parseLocalDate(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const frostDate = formatFrostDate(profile?.last_frost_date ?? null)

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          {profile?.hardiness_zone && (
            <>Zone {profile.hardiness_zone}</>
          )}
          {profile?.hardiness_zone && frostDate && ' | '}
          {frostDate && (
            <>Last Frost: {frostDate}</>
          )}
          {(profile?.hardiness_zone || frostDate) && ' | '}
          Seed Wizard v{packageJson.version}
        </p>
      </div>
    </footer>
  )
}
