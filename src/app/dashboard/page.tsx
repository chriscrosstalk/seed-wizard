import Link from 'next/link'
import { Package, Calendar, Settings, Plus } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome to Seed Wizard. Manage your seed inventory and plan your garden.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Inventory Card */}
        <Link
          href="/dashboard/inventory"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-100 p-3">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 group-hover:text-green-600">
                Seed Inventory
              </h2>
              <p className="text-sm text-gray-500">View and manage your seeds</p>
            </div>
          </div>
        </Link>

        {/* Add Seed Card */}
        <Link
          href="/dashboard/inventory/add"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-600">
                Add Seeds
              </h2>
              <p className="text-sm text-gray-500">Add new seeds to inventory</p>
            </div>
          </div>
        </Link>

        {/* Calendar Card */}
        <Link
          href="/dashboard/calendar"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-purple-100 p-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 group-hover:text-purple-600">
                Planting Calendar
              </h2>
              <p className="text-sm text-gray-500">See when to plant</p>
            </div>
          </div>
        </Link>

        {/* Settings Card */}
        <Link
          href="/dashboard/settings"
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-gray-100 p-3">
              <Settings className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 group-hover:text-gray-700">
                Settings
              </h2>
              <p className="text-sm text-gray-500">Set your location and zone</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
