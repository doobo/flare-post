/**
 * Utility to parse and stringify Markdown Frontmatter metadata
 */

export interface ContentMetadata {
  promo_code?: string
  show_promo_code?: boolean
  start_date?: string
  end_date?: string
  discount_strength?: string
}

function parseBool(val: string): boolean {
  return val.toLowerCase() === 'true'
}

export function parseFrontmatter(content: string): { metadata: ContentMetadata; body: string } {
  if (!content) return { metadata: {}, body: '' }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/)
  if (match) {
    const yamlStr = match[1]
    const body = match[2]
    const metadata: ContentMetadata = {}

    const lines = yamlStr.split(/\r?\n/)
    for (const line of lines) {
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim()
        const val = line.slice(colonIdx + 1).trim()
        if (key === 'show_promo_code') {
          metadata[key] = parseBool(val)
        } else {
          // @ts-ignore
          metadata[key] = val
        }
      }
    }

    return { metadata, body }
  }

  return { metadata: {}, body: content }
}

export function stringifyFrontmatter(metadata: ContentMetadata, body: string): string {
  const yamlLines = Object.entries(metadata)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
    
  if (yamlLines) {
    return `---\n${yamlLines}\n---\n${body}`
  }
  return body
}
