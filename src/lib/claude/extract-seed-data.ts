import { getAnthropicClient } from './client'
import { EXTRACTION_SYSTEM_PROMPT, SEED_EXTRACTION_TOOL, type ExtractedSeedData } from './prompts'

export async function extractSeedData(
  pageContent: string,
  sourceUrl: string
): Promise<ExtractedSeedData> {
  const client = getAnthropicClient()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    tools: [SEED_EXTRACTION_TOOL],
    tool_choice: { type: 'tool', name: 'extract_seed_info' },
    messages: [
      {
        role: 'user',
        content: `${EXTRACTION_SYSTEM_PROMPT}

<webpage_content>
${pageContent}
</webpage_content>

<source_url>
${sourceUrl}
</source_url>

Extract the seed planting information from this product page and use the extract_seed_info tool.`
      }
    ]
  })

  // Find tool use in response
  for (const content of response.content) {
    if (content.type === 'tool_use' && content.name === 'extract_seed_info') {
      return content.input as ExtractedSeedData
    }
  }

  throw new Error('Failed to extract seed data: No tool use in response')
}
