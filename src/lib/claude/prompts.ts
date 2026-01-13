import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const EXTRACTION_SYSTEM_PROMPT = `You are a seed packet information extractor. Extract planting and growing
information from seed company product pages.

IMPORTANT GUIDELINES:
1. Extract ONLY information explicitly stated on the page
2. Do not make assumptions or fill in default values
3. Convert measurements to inches (e.g., "1/4 inch" = 0.25)
4. Split maturity ranges into min/max (e.g., "65-75 days" = min: 65, max: 75)
5. For planting_method:
   - "start_indoors" = seeds started indoors before transplanting
   - "direct_sow" = seeds planted directly in garden
   - "both" = either method works
6. weeks_before_last_frost = weeks before last frost to START seeds indoors
7. weeks_after_last_frost = weeks AFTER last frost to direct sow outdoors
8. cold_hardy = true if can be planted outdoors before last frost date
9. Look for succession planting recommendations
10. Check for fall planting options or cold stratification requirements`

export const SEED_EXTRACTION_TOOL: Tool = {
  name: 'extract_seed_info',
  description: 'Extracts structured seed planting information from a product page',
  input_schema: {
    type: 'object' as const,
    properties: {
      variety_name: {
        type: 'string',
        description: 'The specific variety name (e.g., "Brandywine", "Black Krim")'
      },
      common_name: {
        type: 'string',
        description: 'The common plant name (e.g., "Tomato", "Lettuce")'
      },
      company_name: {
        type: 'string',
        description: 'The seed company name'
      },
      days_to_maturity_min: {
        type: 'integer',
        description: 'Minimum days to maturity/harvest'
      },
      days_to_maturity_max: {
        type: 'integer',
        description: 'Maximum days to maturity/harvest'
      },
      planting_depth_inches: {
        type: 'number',
        description: 'Planting depth in inches'
      },
      spacing_inches: {
        type: 'integer',
        description: 'Plant spacing in inches'
      },
      row_spacing_inches: {
        type: 'integer',
        description: 'Row spacing in inches'
      },
      sun_requirement: {
        type: 'string',
        enum: ['full_sun', 'partial_shade', 'shade'],
        description: 'Sun requirements'
      },
      water_requirement: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Water requirements'
      },
      planting_method: {
        type: 'string',
        enum: ['direct_sow', 'start_indoors', 'both'],
        description: 'Recommended planting method'
      },
      weeks_before_last_frost: {
        type: 'integer',
        description: 'Weeks before last frost to start seeds indoors'
      },
      weeks_after_last_frost: {
        type: 'integer',
        description: 'Weeks after last frost for direct sowing'
      },
      cold_hardy: {
        type: 'boolean',
        description: 'Whether the plant can tolerate frost'
      },
      weeks_before_last_frost_outdoor: {
        type: 'integer',
        description: 'For cold hardy plants: weeks before last frost for outdoor direct sowing'
      },
      succession_planting: {
        type: 'boolean',
        description: 'Whether succession planting is recommended'
      },
      succession_interval_days: {
        type: 'integer',
        description: 'Days between succession plantings'
      },
      fall_planting: {
        type: 'boolean',
        description: 'Whether fall planting is recommended'
      },
      cold_stratification_required: {
        type: 'boolean',
        description: 'Whether cold stratification is required'
      },
      cold_stratification_weeks: {
        type: 'integer',
        description: 'Weeks of cold stratification needed'
      },
      description: {
        type: 'string',
        description: 'Brief description of the variety'
      }
    },
    required: ['variety_name']
  }
}

export interface ExtractedSeedData {
  variety_name: string
  common_name?: string
  company_name?: string
  days_to_maturity_min?: number
  days_to_maturity_max?: number
  planting_depth_inches?: number
  spacing_inches?: number
  row_spacing_inches?: number
  sun_requirement?: 'full_sun' | 'partial_shade' | 'shade'
  water_requirement?: 'low' | 'medium' | 'high'
  planting_method?: 'direct_sow' | 'start_indoors' | 'both'
  weeks_before_last_frost?: number
  weeks_after_last_frost?: number
  cold_hardy?: boolean
  weeks_before_last_frost_outdoor?: number
  succession_planting?: boolean
  succession_interval_days?: number
  fall_planting?: boolean
  cold_stratification_required?: boolean
  cold_stratification_weeks?: number
  description?: string
}
