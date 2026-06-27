/**
 * Utility to parse and stringify Markdown Frontmatter metadata
 */

import { parse as parseYaml } from 'yaml'

export interface ContentMetadata {
  promo_code?: string
  show_promo_code?: boolean
  start_date?: string
  end_date?: string
  discount_strength?: string
}

export function parseFrontmatter(content: string): { metadata: ContentMetadata; body: string } {
  if (!content) return { metadata: {}, body: '' }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/)
  if (match) {
    try {
      const obj = parseYaml(match[1])
      const metadata: ContentMetadata = {}
      if (obj && typeof obj === 'object') {
        for (const [key, val] of Object.entries(obj)) {
          if (key === 'show_promo_code') {
            metadata[key] = typeof val === 'string' ? val.toLowerCase() === 'true' : !!val
          } else {
            // @ts-ignore
            metadata[key] = val
          }
        }
      }
      return { metadata, body: match[2] }
    } catch {
      return { metadata: {}, body: content }
    }
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
