import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const EXTRACTION_SYSTEM_PROMPT = `You are a seed packet information extractor. Extract planting and growing
information from seed company product pages.

FIRST: Determine if this is actually a seed/plant product page. Set is_seed_product_page to true ONLY if the page
is selling seeds, plants, or bulbs with planting information. Set to false for:
- General articles or blog posts about gardening
- News sites, search engines, social media
- Non-gardening e-commerce (electronics, clothing, etc.)
- Garden tools, fertilizers, or other non-plant products

IMPORTANT GUIDELINES:
1. Extract ONLY information explicitly stated on the page
2. Do not make assumptions or fill in default values
3. Convert measurements to inches (e.g., "1/4 inch" = 0.25)
4. Split maturity ranges into min/max (e.g., "65-75 days" = min: 65, max: 75)
5. For planting_method, determine which method the seed company RECOMMENDS:
   - "start_indoors" = seeds started indoors before transplanting (look for "Transplant recommended", "Start indoors", etc.)
   - "direct_sow" = seeds planted directly in garden (look for "Direct sow recommended", "Sow outdoors", etc.)
   - If both methods are mentioned but one says "recommended", use that one
   - If unclear, use "start_indoors" for heat-loving crops (tomatoes, peppers) and "direct_sow" for root crops and cold-hardy greens

TIMING FIELDS - Use the correct field based on planting method and cold hardiness:
6. weeks_before_last_frost = ONLY for planting_method="start_indoors": weeks before last frost to start seeds indoors
7. weeks_after_last_frost = ONLY for planting_method="direct_sow" with cold_hardy=false: weeks AFTER last frost to direct sow
8. weeks_before_last_frost_outdoor = ONLY for planting_method="direct_sow" with cold_hardy=true: weeks BEFORE last frost for outdoor direct sowing
   - Look for phrases like "sow 2-4 weeks before last frost", "as soon as soil can be worked", "early spring"
   - If it says "as soon as soil can be worked" or similar, use 4-6 weeks before last frost

9. cold_hardy = true if plant can tolerate frost or be planted before last frost date
   - Indicators: "cold tolerant", "frost hardy", "cool season", "prefers cool temperatures", "early spring sowing"
10. Look for succession planting recommendations
11. Check for fall planting options or cold stratification requirements
12. Extract the main product image URL from the [Product Images] section at the end of the content (prefer the first URL listed, which is usually og:image)`

export const SEED_EXTRACTION_TOOL: Tool = {
  name: 'extract_seed_info',
  description: 'Extracts structured seed planting information from a product page',
  input_schema: {
    type: 'object' as const,
    properties: {
      is_seed_product_page: {
        type: 'boolean',
        description: 'True if this page is selling seeds/plants/bulbs with planting info. False for non-seed pages, articles, tools, etc.'
      },
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
        enum: ['direct_sow', 'start_indoors'],
        description: 'The recommended planting method based on seed company guidance'
      },
      weeks_before_last_frost: {
        type: 'integer',
        description: 'ONLY for start_indoors: Weeks before last frost to start seeds indoors'
      },
      weeks_after_last_frost: {
        type: 'integer',
        description: 'ONLY for direct_sow + NOT cold hardy: Weeks after last frost for direct sowing'
      },
      cold_hardy: {
        type: 'boolean',
        description: 'True if plant tolerates frost, prefers cool temps, or can be planted before last frost'
      },
      weeks_before_last_frost_outdoor: {
        type: 'integer',
        description: 'ONLY for direct_sow + cold hardy: Weeks BEFORE last frost for outdoor sowing (e.g., "sow 4 weeks before last frost" = 4)'
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
      },
      image_url: {
        type: 'string',
        description: 'URL to the main product image (seed packet or plant photo)'
      }
    },
    required: ['is_seed_product_page']
  }
}

export interface ExtractedSeedData {
  is_seed_product_page: boolean
  variety_name?: string
  common_name?: string
  company_name?: string
  days_to_maturity_min?: number
  days_to_maturity_max?: number
  planting_depth_inches?: number
  spacing_inches?: number
  row_spacing_inches?: number
  sun_requirement?: 'full_sun' | 'partial_shade' | 'shade'
  water_requirement?: 'low' | 'medium' | 'high'
  planting_method?: 'direct_sow' | 'start_indoors'
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
  image_url?: string
}
