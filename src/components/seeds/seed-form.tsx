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
  description?: string
  days_to_maturity_min?: number
  days_to_maturity_max?: number
  planting_depth_inches?: number
  spacing_inches?: number
  row_spacing_inches?: number
  sun_requirement?: string
  water_requirement?: string
  planting_method?: string
  weeks_before_last_frost?: number
  weeks_after_last_frost?: number
  cold_hardy?: boolean
  weeks_before_last_frost_outdoor?: number
  succession_planting?: boolean
  succession_interval_days?: number
  fall_planting?: boolean
  cold_stratification_required?: boolean
  cold_stratification_weeks?: number
  product_url?: string
  image_url?: string
}

export function SeedForm({ initialData, mode }: SeedFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [importUrl, setImportUrl] = useState('')

  // State for dynamic form fields
  const [plantingMethod, setPlantingMethod] = useState<string>(initialData?.planting_method ?? '')
  const [coldHardy, setColdHardy] = useState(initialData?.cold_hardy ?? false)
  const [successionPlanting, setSuccessionPlanting] = useState(initialData?.succession_planting ?? false)
  const [coldStratificationRequired, setColdStratificationRequired] = useState(initialData?.cold_stratification_required ?? false)

  // State for conditionally-rendered weeks fields (need state because fields may not exist when extraction happens)
  const [weeksBeforeLastFrost, setWeeksBeforeLastFrost] = useState<string>(initialData?.weeks_before_last_frost?.toString() ?? '')
  const [weeksAfterLastFrost, setWeeksAfterLastFrost] = useState<string>(initialData?.weeks_after_last_frost?.toString() ?? '')
  const [weeksBeforeLastFrostOutdoor, setWeeksBeforeLastFrostOutdoor] = useState<string>(initialData?.weeks_before_last_frost_outdoor?.toString() ?? '')

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

      // Update state for dynamic fields
      if (data.planting_method) setPlantingMethod(data.planting_method)
      if (data.succession_planting !== undefined) setSuccessionPlanting(!!data.succession_planting)
      if (data.cold_stratification_required !== undefined) setColdStratificationRequired(!!data.cold_stratification_required)

      // Determine cold_hardy - use explicit boolean check to handle null/undefined/"true"/true
      let isColdHardy = coldHardy
      if (data.cold_hardy === true || data.cold_hardy === 'true') {
        isColdHardy = true
        setColdHardy(true)
      } else if (data.cold_hardy === false || data.cold_hardy === 'false') {
        isColdHardy = false
        setColdHardy(false)
      } else if (data.planting_method === 'direct_sow') {
        // Infer cold_hardy from which weeks field has data
        if (typeof data.weeks_before_last_frost_outdoor === 'number') {
          isColdHardy = true
          setColdHardy(true)
        } else if (typeof data.weeks_before_last_frost === 'number' && typeof data.weeks_after_last_frost !== 'number') {
          // If we have weeks_before_last_frost but NOT weeks_after_last_frost for direct sow,
          // this is likely a cold-hardy plant where extraction used wrong field name
          isColdHardy = true
          setColdHardy(true)
        } else if (typeof data.weeks_after_last_frost === 'number') {
          isColdHardy = false
          setColdHardy(false)
        }
      }

      // Update weeks fields state (these are conditionally rendered so need state)
      if (data.planting_method === 'start_indoors') {
        if (typeof data.weeks_before_last_frost === 'number') {
          setWeeksBeforeLastFrost(data.weeks_before_last_frost.toString())
        }
      } else if (data.planting_method === 'direct_sow') {
        if (isColdHardy) {
          // Cold hardy direct sow: use weeks_before_last_frost_outdoor,
          // but fall back to weeks_before_last_frost if that's what extraction returned
          if (typeof data.weeks_before_last_frost_outdoor === 'number') {
            setWeeksBeforeLastFrostOutdoor(data.weeks_before_last_frost_outdoor.toString())
          } else if (typeof data.weeks_before_last_frost === 'number') {
            setWeeksBeforeLastFrostOutdoor(data.weeks_before_last_frost.toString())
          }
        } else {
          if (typeof data.weeks_after_last_frost === 'number') {
            setWeeksAfterLastFrost(data.weeks_after_last_frost.toString())
          }
        }
      }

      // Update form fields with extracted data
      if (formRef.current) {
        const form = formRef.current
        const setInput = (name: string, value: string | number | undefined) => {
          const el = form.elements.namedItem(name) as HTMLInputElement | null
          if (el && value !== undefined) el.value = String(value)
        }
        const setSelect = (name: string, value: string | undefined) => {
          const el = form.elements.namedItem(name) as HTMLSelectElement | null
          if (el && value) el.value = value
        }
        const setCheckbox = (name: string, value: boolean | undefined) => {
          const el = form.elements.namedItem(name) as HTMLInputElement | null
          if (el && value !== undefined) el.checked = value
        }

        // Basic info
        setInput('variety_name', data.variety_name)
        setInput('common_name', data.common_name)
        setInput('seed_company', data.company_name)
        setInput('product_url', data.product_url)

        // Growing info
        setInput('days_to_maturity_min', data.days_to_maturity_min)
        setInput('days_to_maturity_max', data.days_to_maturity_max)
        setInput('planting_depth_inches', data.planting_depth_inches)
        setInput('spacing_inches', data.spacing_inches)
        setInput('row_spacing_inches', data.row_spacing_inches)
        setSelect('sun_requirement', data.sun_requirement)
        setSelect('water_requirement', data.water_requirement)

        // Planting schedule - planting_method and weeks fields are handled via state
        setCheckbox('fall_planting', data.fall_planting)

        // Succession planting - succession_planting is handled via state
        setInput('succession_interval_days', data.succession_interval_days)

        // Cold stratification - cold_stratification_required is handled via state
        setInput('cold_stratification_weeks', data.cold_stratification_weeks)

        // Description/notes
        if (data.description) {
          const notesEl = form.elements.namedItem('notes') as HTMLTextAreaElement | null
          if (notesEl && !notesEl.value) notesEl.value = data.description
        }
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

    const getInt = (name: string) => {
      const val = formData.get(name)
      return val ? parseInt(val as string) : null
    }
    const getFloat = (name: string) => {
      const val = formData.get(name)
      return val ? parseFloat(val as string) : null
    }
    const getString = (name: string) => (formData.get(name) as string) || null

    const data: Partial<SeedInsert> = {
      // Basic info
      variety_name: formData.get('variety_name') as string,
      common_name: getString('common_name'),
      seed_company: getString('seed_company'),
      product_url: getString('product_url'),
      image_url: extractedData?.image_url || initialData?.image_url || null,
      purchase_year: getInt('purchase_year'),
      quantity_packets: parseInt(formData.get('quantity_packets') as string) || 1,
      notes: getString('notes'),

      // Growing info
      days_to_maturity_min: getInt('days_to_maturity_min'),
      days_to_maturity_max: getInt('days_to_maturity_max'),
      planting_depth_inches: getFloat('planting_depth_inches'),
      spacing_inches: getInt('spacing_inches'),
      row_spacing_inches: getInt('row_spacing_inches'),
      sun_requirement: getString('sun_requirement'),
      water_requirement: getString('water_requirement'),

      // Planting schedule
      planting_method: plantingMethod as 'direct_sow' | 'start_indoors' | null || null,
      weeks_before_last_frost: plantingMethod === 'start_indoors' && weeksBeforeLastFrost ? parseInt(weeksBeforeLastFrost) : null,
      weeks_after_last_frost: plantingMethod === 'direct_sow' && !coldHardy && weeksAfterLastFrost ? parseInt(weeksAfterLastFrost) : null,
      weeks_before_last_frost_outdoor: plantingMethod === 'direct_sow' && coldHardy && weeksBeforeLastFrostOutdoor ? parseInt(weeksBeforeLastFrostOutdoor) : null,
      cold_hardy: coldHardy,
      fall_planting: formData.get('fall_planting') === 'on',

      // Succession planting
      succession_planting: successionPlanting,
      succession_interval_days: successionPlanting ? getInt('succession_interval_days') : null,

      // Cold stratification
      cold_stratification_required: coldStratificationRequired,
      cold_stratification_weeks: coldStratificationRequired ? getInt('cold_stratification_weeks') : null,

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

        {/* Growing Requirements */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Growing Requirements</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <label htmlFor="sun_requirement" className="block text-sm font-medium text-gray-700">
                Sun Requirement
              </label>
              <select
                id="sun_requirement"
                name="sun_requirement"
                defaultValue={initialData?.sun_requirement ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Select...</option>
                <option value="full_sun">Full Sun</option>
                <option value="partial_shade">Partial Shade</option>
                <option value="shade">Shade</option>
              </select>
            </div>

            <div>
              <label htmlFor="water_requirement" className="block text-sm font-medium text-gray-700">
                Water Requirement
              </label>
              <select
                id="water_requirement"
                name="water_requirement"
                defaultValue={initialData?.water_requirement ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Select...</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="planting_depth_inches" className="block text-sm font-medium text-gray-700">
                Planting Depth (inches)
              </label>
              <input
                type="number"
                id="planting_depth_inches"
                name="planting_depth_inches"
                min="0"
                step="0.125"
                defaultValue={initialData?.planting_depth_inches ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="spacing_inches" className="block text-sm font-medium text-gray-700">
                Plant Spacing (inches)
              </label>
              <input
                type="number"
                id="spacing_inches"
                name="spacing_inches"
                min="0"
                defaultValue={initialData?.spacing_inches ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="row_spacing_inches" className="block text-sm font-medium text-gray-700">
                Row Spacing (inches)
              </label>
              <input
                type="number"
                id="row_spacing_inches"
                name="row_spacing_inches"
                min="0"
                defaultValue={initialData?.row_spacing_inches ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Planting Schedule */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Planting Schedule</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="planting_method" className="block text-sm font-medium text-gray-700">
                Planting Method
              </label>
              <select
                id="planting_method"
                name="planting_method"
                value={plantingMethod}
                onChange={(e) => setPlantingMethod(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Select...</option>
                <option value="start_indoors">
                  Start Indoors{extractedData?.planting_method === 'start_indoors' ? ' (Recommended)' : ''}
                </option>
                <option value="direct_sow">
                  Direct Sow{extractedData?.planting_method === 'direct_sow' ? ' (Recommended)' : ''}
                </option>
              </select>
            </div>

            {/* Indoor: weeks before last frost */}
            {plantingMethod === 'start_indoors' && (
              <div>
                <label htmlFor="weeks_before_last_frost" className="block text-sm font-medium text-gray-700">
                  Weeks Before Last Frost
                </label>
                <input
                  type="number"
                  id="weeks_before_last_frost"
                  name="weeks_before_last_frost"
                  min="0"
                  value={weeksBeforeLastFrost}
                  onChange={(e) => setWeeksBeforeLastFrost(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            )}

            {/* Direct sow options */}
            {plantingMethod === 'direct_sow' && (
              <>
                <div className="flex items-center gap-2 self-end pb-2">
                  <input
                    type="checkbox"
                    id="cold_hardy"
                    checked={coldHardy}
                    onChange={(e) => setColdHardy(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="cold_hardy" className="text-sm text-gray-700">
                    Cold Hardy
                  </label>
                </div>

                {/* Non cold-hardy: weeks after last frost */}
                {!coldHardy && (
                  <div>
                    <label htmlFor="weeks_after_last_frost" className="block text-sm font-medium text-gray-700">
                      Weeks After Last Frost
                    </label>
                    <input
                      type="number"
                      id="weeks_after_last_frost"
                      name="weeks_after_last_frost"
                      min="0"
                      value={weeksAfterLastFrost}
                      onChange={(e) => setWeeksAfterLastFrost(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                )}

                {/* Cold hardy: weeks before last frost (outdoor) */}
                {coldHardy && (
                  <div>
                    <label htmlFor="weeks_before_last_frost_outdoor" className="block text-sm font-medium text-gray-700">
                      Weeks Before Last Frost
                    </label>
                    <input
                      type="number"
                      id="weeks_before_last_frost_outdoor"
                      name="weeks_before_last_frost_outdoor"
                      min="0"
                      value={weeksBeforeLastFrostOutdoor}
                      onChange={(e) => setWeeksBeforeLastFrostOutdoor(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2 self-end pb-2">
              <input
                type="checkbox"
                id="fall_planting"
                name="fall_planting"
                defaultChecked={initialData?.fall_planting ?? false}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="fall_planting" className="text-sm text-gray-700">
                Fall Planting
              </label>
            </div>
          </div>
        </div>

        {/* Succession Planting - only show if recommended or user enables it */}
        {(successionPlanting || extractedData?.succession_planting) && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Succession Planting</h2>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={successionPlanting}
                  onChange={(e) => setSuccessionPlanting(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Enable</span>
              </label>
            </div>
            {successionPlanting && (
              <div className="max-w-xs">
                <label htmlFor="succession_interval_days" className="block text-sm font-medium text-gray-700">
                  Interval Between Plantings (days)
                </label>
                <input
                  type="number"
                  id="succession_interval_days"
                  name="succession_interval_days"
                  min="1"
                  defaultValue={initialData?.succession_interval_days ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Cold Stratification - only show if required or user enables it */}
        {(coldStratificationRequired || extractedData?.cold_stratification_required) && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Cold Stratification</h2>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={coldStratificationRequired}
                  onChange={(e) => setColdStratificationRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Required</span>
              </label>
            </div>
            {coldStratificationRequired && (
              <div className="max-w-xs">
                <label htmlFor="cold_stratification_weeks" className="block text-sm font-medium text-gray-700">
                  Stratification Period (weeks)
                </label>
                <input
                  type="number"
                  id="cold_stratification_weeks"
                  name="cold_stratification_weeks"
                  min="1"
                  defaultValue={initialData?.cold_stratification_weeks ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            )}
          </div>
        )}

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
