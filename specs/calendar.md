# Seed Wizard - Planting Calendar Specification

## Overview
Calculate personalized planting dates based on user's location (frost dates) and each seed's planting requirements.

## Location Data

### User Profile
- User enters ZIP code in settings
- App looks up from `zip_frost_data` table:
  - `hardiness_zone` (e.g., "7b")
  - `last_frost_date_avg` (e.g., April 15)
  - `first_frost_date_avg` (e.g., October 15)

### Frost Date Lookup API

**GET /api/location?zip=12345**

```json
{
  "zip_code": "12345",
  "hardiness_zone": "6b",
  "last_frost_date_avg": "2000-04-20",
  "first_frost_date_avg": "2000-10-10",
  "latitude": 42.123,
  "longitude": -73.456
}
```

## Planting Event Types

| Event Type | Description | Calculation |
|------------|-------------|-------------|
| `start_indoors` | Start seeds indoors | last_frost - weeks_before_last_frost |
| `transplant` | Move seedlings outdoors | last_frost date |
| `direct_sow` | Plant seeds directly | last_frost + weeks_after_last_frost |
| `cold_hardy_sow` | Direct sow cold-tolerant | last_frost - weeks_before_last_frost_outdoor |
| `succession` | Repeat plantings | base_date + (interval * n) |
| `fall_sow` | Fall planting | first_frost - days_to_maturity - 14 |
| `cold_stratify` | Begin stratification | last_frost - stratification_weeks - 4 |
| `harvest_start` | Estimated harvest | planting_date + days_to_maturity |

## Calculation Logic

### calculatePlantingDates(seed, frostDates)

```typescript
interface FrostDates {
  lastFrost: Date      // Last spring frost
  firstFrost: Date     // First fall frost
  zone: string
}

interface PlantingEvent {
  id: string
  seedId: string
  seedName: string
  commonName: string
  date: Date
  dateEnd?: Date       // For date ranges
  eventType: string
  description: string
  isPast: boolean
}

function calculatePlantingDates(seed, frostDates): PlantingEvent[] {
  const events = []
  const { lastFrost, firstFrost } = frostDates

  // 1. Indoor Start
  if ((seed.planting_method === 'start_indoors' || seed.planting_method === 'both')
      && seed.weeks_before_last_frost) {
    const startDate = subWeeks(lastFrost, seed.weeks_before_last_frost)
    events.push({
      eventType: 'start_indoors',
      date: startDate,
      description: `Start ${seed.variety_name} indoors`
    })

    // Add transplant date
    events.push({
      eventType: 'transplant',
      date: lastFrost,
      description: `Transplant ${seed.variety_name} outdoors`
    })
  }

  // 2. Direct Sow (after last frost)
  if ((seed.planting_method === 'direct_sow' || seed.planting_method === 'both')
      && !seed.cold_hardy) {
    const sowDate = addWeeks(lastFrost, seed.weeks_after_last_frost || 0)
    events.push({
      eventType: 'direct_sow',
      date: sowDate,
      description: `Direct sow ${seed.variety_name}`
    })
  }

  // 3. Cold Hardy Direct Sow (before last frost)
  if (seed.cold_hardy && seed.weeks_before_last_frost_outdoor) {
    const sowDate = subWeeks(lastFrost, seed.weeks_before_last_frost_outdoor)
    events.push({
      eventType: 'cold_hardy_sow',
      date: sowDate,
      description: `Direct sow ${seed.variety_name} (cold hardy)`
    })
  }

  // 4. Succession Plantings
  if (seed.succession_planting && seed.succession_interval_days) {
    // Get base planting date
    const baseDate = getBasePlantingDate(seed, lastFrost)

    // Calculate last possible planting
    const daysToMaturity = seed.days_to_maturity_max || seed.days_to_maturity_min || 60
    const lastPlanting = addDays(firstFrost, -(daysToMaturity + 14))

    let successionDate = addDays(baseDate, seed.succession_interval_days)
    let count = 1

    while (successionDate < lastPlanting && count <= 6) {
      events.push({
        eventType: 'succession',
        date: successionDate,
        description: `Succession #${count} - ${seed.variety_name}`
      })
      successionDate = addDays(successionDate, seed.succession_interval_days)
      count++
    }
  }

  // 5. Fall Planting
  if (seed.fall_planting && seed.days_to_maturity_min) {
    const fallDate = addDays(firstFrost, -(seed.days_to_maturity_min + 14))
    events.push({
      eventType: 'fall_sow',
      date: fallDate,
      description: `Fall sowing - ${seed.variety_name}`
    })
  }

  // 6. Cold Stratification
  if (seed.cold_stratification_required && seed.cold_stratification_weeks) {
    const stratifyDate = subWeeks(lastFrost, seed.cold_stratification_weeks + 4)
    events.push({
      eventType: 'cold_stratify',
      date: stratifyDate,
      description: `Begin cold stratification - ${seed.variety_name}`
    })
  }

  // 7. Harvest Estimate
  if (seed.days_to_maturity_min) {
    const primaryPlanting = events.find(e =>
      e.eventType === 'transplant' ||
      e.eventType === 'direct_sow' ||
      e.eventType === 'cold_hardy_sow'
    )
    if (primaryPlanting) {
      events.push({
        eventType: 'harvest_start',
        date: addDays(primaryPlanting.date, seed.days_to_maturity_min),
        dateEnd: seed.days_to_maturity_max
          ? addDays(primaryPlanting.date, seed.days_to_maturity_max)
          : undefined,
        description: `Harvest begins - ${seed.variety_name}`
      })
    }
  }

  // Mark past events
  const today = new Date()
  events.forEach(e => {
    e.isPast = e.date < today
  })

  return events
}
```

## Calendar API

### GET /api/calendar

Returns all planting events for the current user's seeds.

**Response:**
```json
{
  "events": [
    {
      "id": "seed-123-indoor",
      "seedId": "seed-123",
      "seedName": "Brandywine",
      "commonName": "Tomato",
      "date": "2025-03-01",
      "eventType": "start_indoors",
      "description": "Start Brandywine indoors (6 weeks before last frost)",
      "isPast": false
    },
    {
      "id": "seed-123-transplant",
      "seedId": "seed-123",
      "seedName": "Brandywine",
      "commonName": "Tomato",
      "date": "2025-04-15",
      "eventType": "transplant",
      "description": "Transplant Brandywine outdoors",
      "isPast": false
    }
  ]
}
```

## Calendar UI

### Views
1. **Month View**: Traditional calendar grid, events as colored dots/chips
2. **List View**: Chronological list grouped by week/month
3. **Timeline View** (optional): Visual timeline of all plantings

### Filters
- By event type (indoor starts, transplants, direct sow, etc.)
- By plant category (tomatoes, peppers, greens, etc.)
- By time period (upcoming, past, all)

### Color Coding

| Event Type | Color |
|------------|-------|
| start_indoors | Purple |
| transplant | Green |
| direct_sow | Brown |
| cold_hardy_sow | Blue |
| succession | Orange |
| fall_sow | Red |
| cold_stratify | Cyan |
| harvest_start | Yellow/Gold |

## Grouping Utilities

```typescript
// Group events by month for calendar display
function groupEventsByMonth(events: PlantingEvent[]): Map<string, PlantingEvent[]> {
  const grouped = new Map()
  for (const event of events) {
    const monthKey = format(event.date, 'yyyy-MM')
    const existing = grouped.get(monthKey) || []
    existing.push(event)
    grouped.set(monthKey, existing)
  }
  return grouped
}

// Group events by week for list view
function groupEventsByWeek(events: PlantingEvent[]): Map<string, PlantingEvent[]> {
  const grouped = new Map()
  for (const event of events) {
    const weekKey = format(event.date, "yyyy-'W'ww")
    const existing = grouped.get(weekKey) || []
    existing.push(event)
    grouped.set(weekKey, existing)
  }
  return grouped
}
```

## Date Library

Use `date-fns` for all date calculations:
- `addWeeks`, `subWeeks`
- `addDays`
- `format`
- `isBefore`, `isAfter`

## Example Calculations

### Tomato (Brandywine)
- Last frost: April 15
- weeks_before_last_frost: 6
- days_to_maturity: 80-90

**Events:**
- Start indoors: March 4
- Transplant: April 15
- Harvest: July 4 - July 14

### Lettuce (Butterhead)
- Last frost: April 15
- cold_hardy: true
- weeks_before_last_frost_outdoor: 4
- succession_planting: true
- succession_interval_days: 14

**Events:**
- Direct sow: March 18 (cold hardy)
- Succession #1: April 1
- Succession #2: April 15
- Succession #3: April 29
- ... (until fall cutoff)

### Garlic
- First frost: October 15
- fall_planting: true
- cold_stratification_required: true

**Events:**
- Plant garlic: October (fall planting)
- Harvest: following summer
