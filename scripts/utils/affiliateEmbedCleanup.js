const { createMoshimoLinkBlocks, MOSHIMO_LINKS } = require('../moshimo-affiliate-links')

function normalizeAffiliateUrl(url = '') {
  if (!url || typeof url !== 'string') {
    return ''
  }

  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^\/\//, '')
    .replace(/\/+$/, '')
}

const AFFILIATE_URL_TO_KEY = Object.entries(MOSHIMO_LINKS).reduce((map, [key, link]) => {
  const normalized = normalizeAffiliateUrl(link.url)
  if (normalized) {
    map.set(normalized, key)
  }
  return map
}, new Map())

function findAffiliateKeyByUrl(url = '') {
  const normalized = normalizeAffiliateUrl(url)
  if (!normalized) {
    return null
  }
  return AFFILIATE_URL_TO_KEY.get(normalized) || null
}

function cloneBlock(block) {
  return JSON.parse(JSON.stringify(block))
}

function extractAffiliateEmbedBlock(linkKey) {
  if (!linkKey) return null
  const blocks = createMoshimoLinkBlocks(linkKey)
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return null
  }
  return blocks.find(block => block && block._type === 'affiliateEmbed') || null
}

function restoreInlineAffiliateEmbeds(blocks = []) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { body: blocks, restored: 0 }
  }

  const restoredBlocks = []
  let restored = 0

  for (const originalBlock of blocks) {
    if (
      !originalBlock ||
      originalBlock._type !== 'block' ||
      !Array.isArray(originalBlock.children) ||
      !Array.isArray(originalBlock.markDefs) ||
      originalBlock.markDefs.length === 0
    ) {
      restoredBlocks.push(originalBlock)
      continue
    }

    const affiliateDefs = originalBlock.markDefs.filter(def => findAffiliateKeyByUrl(def?.href))
    if (affiliateDefs.length === 0) {
      restoredBlocks.push(originalBlock)
      continue
    }

    const markKeysToRemove = new Set(affiliateDefs.map(def => def._key))
    const updatedBlock = cloneBlock(originalBlock)
    updatedBlock.markDefs = updatedBlock.markDefs.filter(def => !markKeysToRemove.has(def._key))
    updatedBlock.children = updatedBlock.children.map(child => {
      if (!Array.isArray(child?.marks) || child.marks.length === 0) {
        return child
      }
      return {
        ...child,
        marks: child.marks.filter(markKey => !markKeysToRemove.has(markKey))
      }
    })

    const hasVisibleText = updatedBlock.children.some(child => (child?.text || '').trim().length > 0)
    if (hasVisibleText) {
      restoredBlocks.push(updatedBlock)
    }

    affiliateDefs.forEach(def => {
      const linkKey = findAffiliateKeyByUrl(def.href)
      if (!linkKey) {
        return
      }

      const embedBlock = extractAffiliateEmbedBlock(linkKey)
      if (embedBlock) {
        restoredBlocks.push(embedBlock)
        restored += 1
      }
    })
  }

  return {
    body: restoredBlocks,
    restored
  }
}

module.exports = {
  restoreInlineAffiliateEmbeds
}
