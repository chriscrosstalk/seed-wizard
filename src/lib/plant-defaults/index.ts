/**
 * Plant timing defaults database
 *
 * Used as fallback when AI extraction doesn't capture timing info from seed packets.
 * These are general guidelines based on common gardening practices.
 */

export interface PlantDefault {
  /** Common name variations that should match this entry */
  names: string[]
  /** Category for grouping */
  category: 'vegetable' | 'herb' | 'flower' | 'fruit'
  /** Default planting method */
  planting_method: 'direct_sow' | 'start_indoors'
  /** Can also be started the other way? */
  alternate_method?: 'direct_sow' | 'start_indoors'
  /** Weeks before last frost to start indoors (if start_indoors) */
  weeks_before_last_frost?: number
  /** Weeks after last frost to direct sow (if direct_sow and NOT cold hardy) */
  weeks_after_last_frost?: number
  /** Weeks before last frost for outdoor sowing (if direct_sow AND cold hardy) */
  weeks_before_last_frost_outdoor?: number
  /** Whether plant tolerates frost */
  cold_hardy: boolean
  /** Typical days to maturity range */
  days_to_maturity?: { min: number; max: number }
  /** Notes about timing */
  notes?: string
}

export const PLANT_DEFAULTS: PlantDefault[] = [
  // ============ HERBS ============
  {
    names: ['basil', 'sweet basil', 'genovese basil', 'thai basil'],
    category: 'herb',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 6,
    cold_hardy: false,
    days_to_maturity: { min: 60, max: 90 },
    notes: 'Very frost sensitive. Wait until soil is warm to transplant.'
  },
  {
    names: ['cilantro', 'coriander'],
    category: 'herb',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 2,
    cold_hardy: true,
    days_to_maturity: { min: 45, max: 70 },
    notes: 'Prefers cool weather. Bolts quickly in heat.'
  },
  {
    names: ['dill'],
    category: 'herb',
    planting_method: 'direct_sow',
    weeks_after_last_frost: 1,
    cold_hardy: false,
    days_to_maturity: { min: 40, max: 60 },
    notes: 'Does not transplant well.'
  },
  {
    names: ['parsley', 'flat leaf parsley', 'curly parsley', 'italian parsley'],
    category: 'herb',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 10,
    cold_hardy: true,
    days_to_maturity: { min: 70, max: 90 },
    notes: 'Slow to germinate. Can also direct sow in early spring.'
  },
  {
    names: ['oregano'],
    category: 'herb',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 8,
    cold_hardy: true,
    days_to_maturity: { min: 80, max: 90 }
  },
  {
    names: ['thyme'],
    category: 'herb',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 8,
    cold_hardy: true,
    days_to_maturity: { min: 85, max: 95 }
  },
  {
    names: ['sage'],
    category: 'herb',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 8,
    cold_hardy: true,
    days_to_maturity: { min: 75, max: 85 }
  },
  {
    names: ['mint', 'spearmint', 'peppermint'],
    category: 'herb',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 8,
    cold_hardy: true,
    days_to_maturity: { min: 90, max: 120 }
  },
  {
    names: ['chives'],
    category: 'herb',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 8,
    cold_hardy: true,
    days_to_maturity: { min: 80, max: 90 }
  },

  // ============ VEGETABLES - WARM SEASON ============
  {
    names: ['tomato', 'tomatoes'],
    category: 'vegetable',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 6,
    cold_hardy: false,
    days_to_maturity: { min: 60, max: 85 },
    notes: 'Start indoors 6-8 weeks before last frost.'
  },
  {
    names: ['pepper', 'peppers', 'bell pepper', 'sweet pepper', 'hot pepper', 'chili pepper'],
    category: 'vegetable',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 8,
    cold_hardy: false,
    days_to_maturity: { min: 60, max: 90 },
    notes: 'Start indoors 8-10 weeks before last frost. Need warm soil.'
  },
  {
    names: ['eggplant', 'aubergine'],
    category: 'vegetable',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 8,
    cold_hardy: false,
    days_to_maturity: { min: 70, max: 85 }
  },
  {
    names: ['cucumber', 'cucumbers'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    alternate_method: 'start_indoors',
    weeks_after_last_frost: 2,
    cold_hardy: false,
    days_to_maturity: { min: 50, max: 70 },
    notes: 'Can start indoors 3-4 weeks before last frost.'
  },
  {
    names: ['squash', 'summer squash', 'winter squash', 'zucchini', 'acorn squash', 'butternut squash', 'spaghetti squash', 'pumpkin', 'pumpkins'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    alternate_method: 'start_indoors',
    weeks_after_last_frost: 2,
    cold_hardy: false,
    days_to_maturity: { min: 45, max: 110 },
    notes: 'Can start indoors 3-4 weeks before last frost. Direct sow preferred.'
  },
  {
    names: ['melon', 'watermelon', 'cantaloupe', 'honeydew'],
    category: 'fruit',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 4,
    cold_hardy: false,
    days_to_maturity: { min: 70, max: 100 }
  },
  {
    names: ['corn', 'sweet corn'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_after_last_frost: 2,
    cold_hardy: false,
    days_to_maturity: { min: 60, max: 100 },
    notes: 'Plant in blocks for good pollination.'
  },
  {
    names: ['bean', 'beans', 'green bean', 'bush bean', 'pole bean', 'snap bean'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_after_last_frost: 1,
    cold_hardy: false,
    days_to_maturity: { min: 50, max: 65 },
    notes: 'Direct sow after danger of frost has passed.'
  },
  {
    names: ['okra'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_after_last_frost: 3,
    cold_hardy: false,
    days_to_maturity: { min: 50, max: 65 },
    notes: 'Needs warm soil (65F+).'
  },

  // ============ VEGETABLES - COOL SEASON ============
  {
    names: ['lettuce', 'leaf lettuce', 'romaine', 'butterhead', 'head lettuce'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    alternate_method: 'start_indoors',
    weeks_before_last_frost_outdoor: 4,
    cold_hardy: true,
    days_to_maturity: { min: 30, max: 70 },
    notes: 'Can start indoors 4-6 weeks before last frost. Succession plant every 2 weeks.'
  },
  {
    names: ['spinach'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 6,
    cold_hardy: true,
    days_to_maturity: { min: 37, max: 50 },
    notes: 'Very cold hardy. Plant as soon as soil can be worked.'
  },
  {
    names: ['kale'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    alternate_method: 'start_indoors',
    weeks_before_last_frost_outdoor: 4,
    cold_hardy: true,
    days_to_maturity: { min: 55, max: 75 },
    notes: 'Can start indoors 4-6 weeks before last frost. Flavor improves after frost.'
  },
  {
    names: ['swiss chard', 'chard'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 2,
    cold_hardy: true,
    days_to_maturity: { min: 50, max: 60 }
  },
  {
    names: ['arugula', 'rocket'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 4,
    cold_hardy: true,
    days_to_maturity: { min: 35, max: 50 }
  },
  {
    names: ['pea', 'peas', 'snap pea', 'snow pea', 'garden pea', 'shelling pea'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 6,
    cold_hardy: true,
    days_to_maturity: { min: 55, max: 70 },
    notes: 'Plant as soon as soil can be worked in spring.'
  },
  {
    names: ['broccoli'],
    category: 'vegetable',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 6,
    cold_hardy: true,
    days_to_maturity: { min: 55, max: 80 }
  },
  {
    names: ['cauliflower'],
    category: 'vegetable',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 6,
    cold_hardy: true,
    days_to_maturity: { min: 55, max: 80 }
  },
  {
    names: ['cabbage'],
    category: 'vegetable',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 6,
    cold_hardy: true,
    days_to_maturity: { min: 70, max: 100 }
  },
  {
    names: ['brussels sprouts', 'brussels sprout'],
    category: 'vegetable',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 6,
    cold_hardy: true,
    days_to_maturity: { min: 90, max: 120 }
  },
  {
    names: ['kohlrabi'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 4,
    cold_hardy: true,
    days_to_maturity: { min: 45, max: 60 }
  },

  // ============ VEGETABLES - ROOT CROPS ============
  {
    names: ['carrot', 'carrots'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 3,
    cold_hardy: true,
    days_to_maturity: { min: 60, max: 80 },
    notes: 'Does not transplant well. Direct sow only.'
  },
  {
    names: ['beet', 'beets', 'beetroot'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 4,
    cold_hardy: true,
    days_to_maturity: { min: 50, max: 70 }
  },
  {
    names: ['radish', 'radishes'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 4,
    cold_hardy: true,
    days_to_maturity: { min: 22, max: 30 },
    notes: 'Fast growing. Succession plant every 2 weeks.'
  },
  {
    names: ['turnip', 'turnips'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 4,
    cold_hardy: true,
    days_to_maturity: { min: 45, max: 60 }
  },
  {
    names: ['parsnip', 'parsnips'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 3,
    cold_hardy: true,
    days_to_maturity: { min: 100, max: 130 },
    notes: 'Very slow to germinate. Flavor improves after frost.'
  },
  {
    names: ['onion', 'onions'],
    category: 'vegetable',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 10,
    cold_hardy: true,
    days_to_maturity: { min: 90, max: 120 }
  },
  {
    names: ['leek', 'leeks'],
    category: 'vegetable',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 10,
    cold_hardy: true,
    days_to_maturity: { min: 90, max: 120 }
  },
  {
    names: ['garlic'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 6,
    cold_hardy: true,
    days_to_maturity: { min: 240, max: 270 },
    notes: 'Best planted in fall for harvest following summer.'
  },
  {
    names: ['potato', 'potatoes'],
    category: 'vegetable',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 2,
    cold_hardy: true,
    days_to_maturity: { min: 70, max: 120 },
    notes: 'Plant seed potatoes, not seeds.'
  },
  {
    names: ['sweet potato', 'sweet potatoes'],
    category: 'vegetable',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 8,
    cold_hardy: false,
    days_to_maturity: { min: 90, max: 120 },
    notes: 'Start slips indoors or purchase transplants.'
  },

  // ============ FLOWERS - COOL SEASON ============
  {
    names: ['pansy', 'pansies', 'viola'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 8,
    cold_hardy: true,
    days_to_maturity: { min: 70, max: 84 }
  },
  {
    names: ['snapdragon', 'snapdragons'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 10,
    cold_hardy: true,
    days_to_maturity: { min: 80, max: 100 }
  },
  {
    names: ['sweet pea', 'sweet peas'],
    category: 'flower',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 6,
    cold_hardy: true,
    days_to_maturity: { min: 50, max: 65 },
    notes: 'Prefers cool weather. Plant as early as possible.'
  },
  {
    names: ['larkspur'],
    category: 'flower',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 4,
    cold_hardy: true,
    days_to_maturity: { min: 80, max: 100 }
  },
  {
    names: ['bachelor button', 'cornflower', 'centaurea'],
    category: 'flower',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 4,
    cold_hardy: true,
    days_to_maturity: { min: 60, max: 80 },
    notes: 'Can also be fall sown for earlier spring bloom.'
  },
  {
    names: ['poppy', 'poppies', 'california poppy'],
    category: 'flower',
    planting_method: 'direct_sow',
    weeks_before_last_frost_outdoor: 4,
    cold_hardy: true,
    days_to_maturity: { min: 60, max: 90 },
    notes: 'Does not transplant well.'
  },
  {
    names: ['stock'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 8,
    cold_hardy: true,
    days_to_maturity: { min: 70, max: 84 }
  },

  // ============ FLOWERS - WARM SEASON ============
  {
    names: ['zinnia', 'zinnias'],
    category: 'flower',
    planting_method: 'direct_sow',
    weeks_after_last_frost: 1,
    cold_hardy: false,
    days_to_maturity: { min: 60, max: 75 },
    notes: 'Direct sow after frost. Can start indoors 4 weeks before last frost.'
  },
  {
    names: ['marigold', 'marigolds'],
    category: 'flower',
    planting_method: 'direct_sow',
    alternate_method: 'start_indoors',
    weeks_after_last_frost: 0,
    cold_hardy: false,
    days_to_maturity: { min: 50, max: 75 },
    notes: 'Can start indoors 6-8 weeks before last frost.'
  },
  {
    names: ['sunflower', 'sunflowers'],
    category: 'flower',
    planting_method: 'direct_sow',
    weeks_after_last_frost: 1,
    cold_hardy: false,
    days_to_maturity: { min: 55, max: 100 },
    notes: 'Direct sow preferred. Does not transplant well.'
  },
  {
    names: ['cosmos'],
    category: 'flower',
    planting_method: 'direct_sow',
    weeks_after_last_frost: 1,
    cold_hardy: false,
    days_to_maturity: { min: 60, max: 90 },
    notes: 'Easy from direct sow. Can start indoors 4-6 weeks before.'
  },
  {
    names: ['nasturtium', 'nasturtiums'],
    category: 'flower',
    planting_method: 'direct_sow',
    weeks_after_last_frost: 1,
    cold_hardy: false,
    days_to_maturity: { min: 50, max: 65 },
    notes: 'Direct sow preferred.'
  },
  {
    names: ['morning glory'],
    category: 'flower',
    planting_method: 'direct_sow',
    weeks_after_last_frost: 1,
    cold_hardy: false,
    days_to_maturity: { min: 60, max: 90 }
  },
  {
    names: ['celosia', 'cockscomb'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 6,
    cold_hardy: false,
    days_to_maturity: { min: 90, max: 120 }
  },
  {
    names: ['impatiens'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 10,
    cold_hardy: false,
    days_to_maturity: { min: 70, max: 90 }
  },
  {
    names: ['petunia', 'petunias'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 10,
    cold_hardy: false,
    days_to_maturity: { min: 75, max: 90 }
  },
  {
    names: ['aster', 'asters', 'china aster'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 7,
    cold_hardy: false,
    days_to_maturity: { min: 90, max: 120 }
  },
  {
    names: ['dahlia', 'dahlias'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 6,
    cold_hardy: false,
    days_to_maturity: { min: 90, max: 120 }
  },
  {
    names: ['strawflower', 'strawflowers', 'everlasting'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 6,
    cold_hardy: false,
    days_to_maturity: { min: 75, max: 90 }
  },

  // ============ SHADE TOLERANT / GROUND COVERS ============
  {
    names: ['coleus'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 10,
    cold_hardy: false,
    days_to_maturity: { min: 70, max: 90 }
  },
  {
    names: ['hosta'],
    category: 'flower',
    planting_method: 'start_indoors',
    weeks_before_last_frost: 10,
    cold_hardy: true,
    days_to_maturity: { min: 90, max: 180 }
  },
  {
    names: ['shade mix', 'shade garden mix', 'shade flower mix'],
    category: 'flower',
    planting_method: 'direct_sow',
    weeks_after_last_frost: 1,
    cold_hardy: false,
    days_to_maturity: { min: 60, max: 90 },
    notes: 'Most shade mixes should be sown after last frost.'
  }
]

/**
 * Find a plant default by common name
 * Does fuzzy matching - checks if the search term is contained in any of the names
 */
export function findPlantDefault(commonName: string): PlantDefault | undefined {
  if (!commonName) return undefined

  const searchTerm = commonName.toLowerCase().trim()

  // First try exact match
  const exactMatch = PLANT_DEFAULTS.find(plant =>
    plant.names.some(name => name.toLowerCase() === searchTerm)
  )
  if (exactMatch) return exactMatch

  // Then try partial match (search term contained in name)
  const partialMatch = PLANT_DEFAULTS.find(plant =>
    plant.names.some(name => name.toLowerCase().includes(searchTerm))
  )
  if (partialMatch) return partialMatch

  // Finally try reverse partial match (name contained in search term)
  const reverseMatch = PLANT_DEFAULTS.find(plant =>
    plant.names.some(name => searchTerm.includes(name.toLowerCase()))
  )
  return reverseMatch
}

/**
 * Get timing info from defaults to fill in missing extraction data
 */
export function getDefaultTiming(commonName: string): {
  planting_method?: 'direct_sow' | 'start_indoors'
  weeks_before_last_frost?: number
  weeks_after_last_frost?: number
  weeks_before_last_frost_outdoor?: number
  cold_hardy?: boolean
} | undefined {
  const plant = findPlantDefault(commonName)
  if (!plant) return undefined

  return {
    planting_method: plant.planting_method,
    weeks_before_last_frost: plant.weeks_before_last_frost,
    weeks_after_last_frost: plant.weeks_after_last_frost,
    weeks_before_last_frost_outdoor: plant.weeks_before_last_frost_outdoor,
    cold_hardy: plant.cold_hardy
  }
}
