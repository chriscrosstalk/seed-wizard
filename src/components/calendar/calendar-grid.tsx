'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import type { Seed } from '@/types/database'

type CategoryFilter = 'vegetable' | 'flower' | 'herb'

interface SeedWithPlanting {
  seed: Seed
  planting: { date: Date; eventType: string }
  category: CategoryFilter
}

interface CalendarGridProps {
  sortedSeeds: SeedWithPlanting[]
}

const categoryDotStyles: Record<CategoryFilter, string> = {
  vegetable: 'bg-sky-400',
  flower: 'bg-rose-400',
  herb: 'bg-emerald-400',
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_DOTS_VISIBLE = 5

function getCalendarDays(year: number, month: number): Date[] {
  const monthStart = startOfMonth(new Date(year, month))
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
}

function groupSeedsByDate(seeds: SeedWithPlanting[]): Map<string, SeedWithPlanting[]> {
  const grouped = new Map<string, SeedWithPlanting[]>()

  for (const seed of seeds) {
    const dateKey = format(seed.planting.date, 'yyyy-MM-dd')
    const existing = grouped.get(dateKey) || []
    existing.push(seed)
    grouped.set(dateKey, existing)
  }

  return grouped
}

export function CalendarGrid({ sortedSeeds }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month])
  const seedsByDate = useMemo(() => groupSeedsByDate(sortedSeeds), [sortedSeeds])

  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1))
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1))
  const goToToday = () => setCurrentDate(new Date())

  const selectedDaySeeds = selectedDay
    ? seedsByDate.get(format(selectedDay, 'yyyy-MM-dd')) || []
    : []

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const daySeeds = seedsByDate.get(dateKey) || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const hasSeeds = daySeeds.length > 0
            const overflowCount = daySeeds.length - MAX_DOTS_VISIBLE

            return (
              <button
                key={index}
                onClick={() => setSelectedDay(hasSeeds ? day : null)}
                className={`
                  min-h-[80px] p-2 border-b border-r border-gray-100 text-left
                  transition-colors relative
                  ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                  ${hasSeeds ? 'hover:bg-green-50 cursor-pointer' : 'cursor-default'}
                  ${isSelected ? 'bg-green-100 ring-2 ring-green-500 ring-inset' : ''}
                `}
              >
                {/* Day number */}
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 text-sm rounded-full
                    ${isDayToday ? 'bg-green-600 text-white font-bold' : ''}
                    ${!isDayToday && isCurrentMonth ? 'text-gray-900' : ''}
                    ${!isDayToday && !isCurrentMonth ? 'text-gray-400' : ''}
                  `}
                >
                  {format(day, 'd')}
                </span>

                {/* Seed dots */}
                {daySeeds.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {daySeeds.slice(0, MAX_DOTS_VISIBLE).map((item, i) => (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full ${categoryDotStyles[item.category]}`}
                        title={`${item.seed.variety_name} - ${item.planting.eventType}`}
                      />
                    ))}
                    {overflowCount > 0 && (
                      <span className="text-xs text-gray-500 font-medium ml-1">
                        +{overflowCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day details */}
      {selectedDay && selectedDaySeeds.length > 0 && (
        <div className="border border-gray-200 rounded-lg bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              {format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <div className="space-y-2">
            {selectedDaySeeds.map(({ seed, planting, category }) => (
              <div
                key={seed.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
              >
                <span
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${categoryDotStyles[category]}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {seed.variety_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {seed.common_name && `${seed.common_name} • `}
                    {planting.eventType}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-400" />
          <span>Vegetables</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-400" />
          <span>Flowers</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span>Herbs</span>
        </div>
      </div>
    </div>
  )
}
