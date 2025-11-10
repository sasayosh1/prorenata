const { randomUUID } = require('crypto')

function ensurePortableTextKeys(blocks = []) {
  if (!Array.isArray(blocks)) return blocks

  return blocks.map(block => {
    if (!block || typeof block !== 'object') return block

    const keyedBlock = { ...block }
    if (!keyedBlock._key) {
      keyedBlock._key = randomUUID()
    }

    if (Array.isArray(keyedBlock.children)) {
      keyedBlock.children = keyedBlock.children.map(child => {
        if (!child || typeof child !== 'object') return child
        const keyedChild = { ...child }
        if (!keyedChild._key) {
          keyedChild._key = randomUUID()
        }
        return keyedChild
      })
    }

    if (Array.isArray(keyedBlock.markDefs)) {
      keyedBlock.markDefs = keyedBlock.markDefs.map(mark => {
        if (!mark || typeof mark !== 'object') return mark
        const keyedMark = { ...mark }
        if (!keyedMark._key) {
          keyedMark._key = randomUUID()
        }
        return keyedMark
      })
    }

    return keyedBlock
  })
}

function ensureReferenceKeys(references = []) {
  if (!Array.isArray(references)) return references

  return references.map(reference => {
    if (!reference || typeof reference !== 'object') return reference
    if (reference._key) return reference
    return {
      ...reference,
      _key: randomUUID()
    }
  })
}

module.exports = {
  ensurePortableTextKeys,
  ensureReferenceKeys
}
