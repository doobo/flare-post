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

export function parseFrontmatter(content: string): { metadata: ContentMetadata; body: string } {
  if (!content) return { metadata: {}, body: '' }
  
  // Regex to match frontmatter delimited by ---
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (match) {
    const yamlStr = match[1]
    const body = match[2]
    const metadata: ContentMetadata = {}
    
    yamlStr.split(/\r?\n/).forEach(line => {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const key = parts[0].trim() as keyof ContentMetadata
        const val = parts.slice(1).join(':').trim()
        
        if (key === 'show_promo_code') {
          metadata[key] = val === 'true'
        } else {
          // @ts-ignore
          metadata[key] = val
        }
      }
    })
    
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
