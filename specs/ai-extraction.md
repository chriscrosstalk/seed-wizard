# Seed Wizard - AI Extraction Specification

## Overview
Use Claude API to extract structured seed planting data from seed company product pages.

## Flow

1. User pastes a product URL (e.g., Johnny's Seeds tomato page)
2. Frontend calls `/api/extract` with the URL
3. Backend fetches page content and cleans HTML
4. Backend sends cleaned content to Claude with extraction tool
5. Claude returns structured data via tool use
6. Frontend displays extracted data for user review
7. User can edit fields before saving to database

## API Endpoint

### POST /api/extract

**Request:**
```json
{
  "url": "https://www.johnnyseeds.com/vegetables/tomatoes/slicing-tomatoes/brandywine-tomato-seed-123.html"
}
```

**Response:**
```json
{
  "variety_name": "Brandywine",
  "common_name": "Tomato",
  "company_name": "Johnny's Selected Seeds",
  "days_to_maturity_min": 80,
  "days_to_maturity_max": 90,
  "planting_depth_inches": 0.25,
  "spacing_inches": 24,
  "row_spacing_inches": 36,
  "sun_requirement": "full_sun",
  "planting_method": "start_indoors",
  "weeks_before_last_frost": 6,
  "succession_planting": false,
  "description": "Classic heirloom beefsteak with rich, complex flavor..."
}
```

## Page Fetching

### fetch-page.ts

```typescript
export async function fetchPageContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SeedWizard/1.0)',
      'Accept': 'text/html'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }

  const html = await response.text()
  return cleanHtmlContent(html)
}

function cleanHtmlContent(html: string): string {
  // Remove scripts, styles, nav, footer, header
  // Convert HTML to readable text
  // Keep product-relevant content
  // Limit to ~15k chars to avoid token limits
}
```

## Claude Integration

### Claude Tool Schema

```typescript
const SEED_EXTRACTION_TOOL = {
  name: 'extract_seed_info',
  description: 'Extracts structured seed planting information from a product page',
  input_schema: {
    type: 'object',
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
```

### System Prompt

```
You are a seed packet information extractor. Extract planting and growing
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
10. Check for fall planting options or cold stratification requirements
```

### Extraction Function

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function extractSeedData(pageContent: string, sourceUrl: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    tools: [SEED_EXTRACTION_TOOL],
    tool_choice: { type: 'tool', name: 'extract_seed_info' },
    messages: [
      {
        role: 'user',
        content: `${SYSTEM_PROMPT}

<webpage_content>
${pageContent}
</webpage_content>

<source_url>
${sourceUrl}
</source_url>

Extract the seed planting information and use the extract_seed_info tool.`
      }
    ]
  })

  // Find tool use in response
  for (const content of response.content) {
    if (content.type === 'tool_use' && content.name === 'extract_seed_info') {
      return content.input
    }
  }

  throw new Error('Failed to extract seed data')
}
```

## Supported Seed Companies

The AI extraction should work with any seed company page, but has been designed with these common formats in mind:

| Company | URL Pattern | Notes |
|---------|-------------|-------|
| Johnny's Selected Seeds | johnnyseeds.com | Well-structured, tabbed info |
| Baker Creek / Rare Seeds | rareseeds.com | Narrative descriptions |
| Burpee | burpee.com | "Growing Information" section |
| Seed Savers Exchange | seedsavers.org | "How to Grow" tabs |
| High Mowing Seeds | highmowingseeds.com | Comprehensive guides |
| Territorial Seed | territorialseed.com | Structured product details |

## Error Handling

1. **Page fetch fails**: Return 500 with "Failed to fetch page"
2. **Claude extraction fails**: Return 500 with "Failed to extract seed data"
3. **Partial extraction**: Return whatever was extracted, let user fill in gaps
4. **Rate limiting**: Implement exponential backoff for Claude API

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

## Cost Considerations

- Claude Sonnet: ~$3/million input tokens, ~$15/million output tokens
- Average seed page: ~10k tokens input, ~500 tokens output
- Cost per extraction: ~$0.01
- Consider caching extracted data by URL to avoid re-extraction
