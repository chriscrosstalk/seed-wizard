'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import type { Seed, SeedInsert } from '@/types/database'

interface SeedFormProps {
  initialData?: Seed
  mode: 'create' | 'edit'
}

interface ExtractedData {
  variety_name?: string
  common_name?: string
  company_name?: string
  days_to_maturity_min?: number
  days_to_maturity_max?: number
  planting_method?: string
  weeks_before_last_frost?: number
  weeks_after_last_frost?: number
  cold_hardy?: boolean
  succession_planting?: boolean
  succession_interval_days?: number
  product_url?: string
}

export function SeedForm({ initialData, mode }: SeedFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [importUrl, setImportUrl] = useState('')

  const handleImportFromUrl = async () => {
    if (!importUrl) {
      setError('Please enter a URL to import from')
      return
    }

    setIsExtracting(true)
    setError(null)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract seed data')
      }

      setExtractedData(data)

      // Update form fields with extracted data
      if (formRef.current) {
        const form = formRef.current
        if (data.variety_name) (form.elements.namedItem('variety_name') as HTMLInputElement).value = data.variety_name
        if (data.common_name) (form.elements.namedItem('common_name') as HTMLInputElement).value = data.common_name
        if (data.company_name) (form.elements.namedItem('seed_company') as HTMLInputElement).value = data.company_name
        if (data.product_url) (form.elements.namedItem('product_url') as HTMLInputElement).value = data.product_url
        if (data.days_to_maturity_min) (form.elements.namedItem('days_to_maturity_min') as HTMLInputElement).value = String(data.days_to_maturity_min)
        if (data.days_to_maturity_max) (form.elements.namedItem('days_to_maturity_max') as HTMLInputElement).value = String(data.days_to_maturity_max)
        if (data.planting_method) (form.elements.namedItem('planting_method') as HTMLSelectElement).value = data.planting_method
        if (data.weeks_before_last_frost) (form.elements.namedItem('weeks_before_last_frost') as HTMLInputElement).value = String(data.weeks_before_last_frost)
        if (data.weeks_after_last_frost) (form.elements.namedItem('weeks_after_last_frost') as HTMLInputElement).value = String(data.weeks_after_last_frost)
        if (data.cold_hardy !== undefined) (form.elements.namedItem('cold_hardy') as HTMLInputElement).checked = data.cold_hardy
        if (data.succession_planting !== undefined) (form.elements.namedItem('succession_planting') as HTMLInputElement).checked = data.succession_planting
        if (data.succession_interval_days) (form.elements.namedItem('succession_interval_days') as HTMLInputElement).value = String(data.succession_interval_days)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during extraction')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const data: Partial<SeedInsert> = {
      variety_name: formData.get('variety_name') as string,
      common_name: formData.get('common_name') as string || null,
      seed_company: formData.get('seed_company') as string || null,
      product_url: formData.get('product_url') as string || null,
      purchase_year: formData.get('purchase_year') ? parseInt(formData.get('purchase_year') as string) : null,
      quantity_packets: parseInt(formData.get('quantity_packets') as string) || 1,
      notes: formData.get('notes') as string || null,
      days_to_maturity_min: formData.get('days_to_maturity_min') ? parseInt(formData.get('days_to_maturity_min') as string) : null,
      days_to_maturity_max: formData.get('days_to_maturity_max') ? parseInt(formData.get('days_to_maturity_max') as string) : null,
      planting_method: formData.get('planting_method') as 'direct_sow' | 'start_indoors' | 'both' | null || null,
      weeks_before_last_frost: formData.get('weeks_before_last_frost') ? parseInt(formData.get('weeks_before_last_frost') as string) : null,
      weeks_after_last_frost: formData.get('weeks_after_last_frost') ? parseInt(formData.get('weeks_after_last_frost') as string) : null,
      cold_hardy: formData.get('cold_hardy') === 'on',
      succession_planting: formData.get('succession_planting') === 'on',
      succession_interval_days: formData.get('succession_interval_days') ? parseInt(formData.get('succession_interval_days') as string) : null,
      ai_extracted: extractedData !== null,
    }

    try {
      const url = mode === 'create' ? '/api/seeds' : `/api/seeds/${initialData?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save seed')
      }

      router.push('/dashboard/inventory')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Import from URL Section */}
      {mode === 'create' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="flex items-center gap-2 text-lg font-medium text-blue-900">
            <Sparkles className="h-5 w-5" />
            Import from URL
          </h2>
          <p className="mt-1 text-sm text-blue-700">
            Paste a seed product URL to automatically extract planting information.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.johnnyseeds.com/..."
              className="block flex-1 rounded-md border border-blue-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleImportFromUrl}
              disabled={isExtracting || !importUrl}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Import
                </>
              )}
            </button>
          </div>
          {extractedData && (
            <p className="mt-2 text-sm text-green-700">
              Data extracted successfully. Review and edit below before saving.
            </p>
          )}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Basic Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="variety_name" className="block text-sm font-medium text-gray-700">
                Variety Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="variety_name"
                name="variety_name"
                required
                defaultValue={initialData?.variety_name}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="e.g., Brandywine"
              />
            </div>

            <div>
              <label htmlFor="common_name" className="block text-sm font-medium text-gray-700">
                Common Name
              </label>
              <input
                type="text"
                id="common_name"
                name="common_name"
                defaultValue={initialData?.common_name ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="e.g., Tomato"
              />
            </div>

            <div>
              <label htmlFor="seed_company" className="block text-sm font-medium text-gray-700">
                Seed Company
              </label>
              <input
                type="text"
                id="seed_company"
                name="seed_company"
                defaultValue={initialData?.seed_company ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="e.g., Johnny's Seeds"
              />
            </div>

            <div>
              <label htmlFor="purchase_year" className="block text-sm font-medium text-gray-700">
                Purchase Year
              </label>
              <input
                type="number"
                id="purchase_year"
                name="purchase_year"
                min="1900"
                max="2100"
                defaultValue={initialData?.purchase_year ?? new Date().getFullYear()}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="quantity_packets" className="block text-sm font-medium text-gray-700">
                Quantity (packets)
              </label>
              <input
                type="number"
                id="quantity_packets"
                name="quantity_packets"
                min="1"
                defaultValue={initialData?.quantity_packets ?? 1}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="product_url" className="block text-sm font-medium text-gray-700">
                Product URL
              </label>
              <input
                type="url"
                id="product_url"
                name="product_url"
                defaultValue={initialData?.product_url ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Planting Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Planting Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="days_to_maturity_min" className="block text-sm font-medium text-gray-700">
                Days to Maturity (min)
              </label>
              <input
                type="number"
                id="days_to_maturity_min"
                name="days_to_maturity_min"
                min="1"
                defaultValue={initialData?.days_to_maturity_min ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="days_to_maturity_max" className="block text-sm font-medium text-gray-700">
                Days to Maturity (max)
              </label>
              <input
                type="number"
                id="days_to_maturity_max"
                name="days_to_maturity_max"
                min="1"
                defaultValue={initialData?.days_to_maturity_max ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="planting_method" className="block text-sm font-medium text-gray-700">
                Planting Method
              </label>
              <select
                id="planting_method"
                name="planting_method"
                defaultValue={initialData?.planting_method ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Select...</option>
                <option value="start_indoors">Start Indoors</option>
                <option value="direct_sow">Direct Sow</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label htmlFor="weeks_before_last_frost" className="block text-sm font-medium text-gray-700">
                Weeks Before Last Frost (indoor start)
              </label>
              <input
                type="number"
                id="weeks_before_last_frost"
                name="weeks_before_last_frost"
                min="0"
                defaultValue={initialData?.weeks_before_last_frost ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="weeks_after_last_frost" className="block text-sm font-medium text-gray-700">
                Weeks After Last Frost (direct sow)
              </label>
              <input
                type="number"
                id="weeks_after_last_frost"
                name="weeks_after_last_frost"
                min="0"
                defaultValue={initialData?.weeks_after_last_frost ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="succession_interval_days" className="block text-sm font-medium text-gray-700">
                Succession Interval (days)
              </label>
              <input
                type="number"
                id="succession_interval_days"
                name="succession_interval_days"
                min="1"
                defaultValue={initialData?.succession_interval_days ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="flex items-center gap-6 sm:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="cold_hardy"
                  defaultChecked={initialData?.cold_hardy ?? false}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Cold Hardy</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="succession_planting"
                  defaultChecked={initialData?.succession_planting ?? false}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Succession Planting</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Notes</h2>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={initialData?.notes ?? ''}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="Any additional notes about this seed..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Add Seed' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
