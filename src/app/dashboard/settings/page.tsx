'use client'

import { useState } from 'react'
import { MapPin, Loader2, Check } from 'lucide-react'

export default function SettingsPage() {
  const [zipCode, setZipCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [locationData, setLocationData] = useState<{
    hardiness_zone: string | null
    last_frost_date: string | null
    first_frost_date: string | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleLookup = async () => {
    if (!zipCode || zipCode.length < 5) {
      setError('Please enter a valid 5-digit ZIP code')
      return
    }

    setIsLoading(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch(`/api/location?zip=${zipCode}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to look up location')
      }

      setLocationData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLocationData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!locationData) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip_code: zipCode,
          hardiness_zone: locationData.hardiness_zone,
          last_frost_date: locationData.last_frost_date,
          first_frost_date: locationData.first_frost_date,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-2 text-gray-600">
        Configure your location to get personalized planting dates.
      </p>

      <div className="mt-8 max-w-xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900">
            <MapPin className="h-5 w-5 text-green-600" />
            Your Location
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter your ZIP code to look up your USDA hardiness zone and frost dates.
          </p>

          <div className="mt-4">
            <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
              ZIP Code
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                id="zip_code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="12345"
                maxLength={5}
                className="block w-32 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                onClick={handleLookup}
                disabled={isLoading || zipCode.length < 5}
                className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Look Up
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {locationData && (
            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-green-50 p-4">
                <h3 className="font-medium text-green-800">Location Found</h3>
                <dl className="mt-2 space-y-1 text-sm text-green-700">
                  <div className="flex justify-between">
                    <dt>Hardiness Zone:</dt>
                    <dd className="font-medium">{locationData.hardiness_zone || 'Unknown'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Last Spring Frost:</dt>
                    <dd className="font-medium">{formatDate(locationData.last_frost_date)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>First Fall Frost:</dt>
                    <dd className="font-medium">{formatDate(locationData.first_frost_date)}</dd>
                  </div>
                </dl>
              </div>

              <button
                onClick={handleSave}
                disabled={isLoading || saved}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Location'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
