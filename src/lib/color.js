const parse = (hex) => {
  const h = String(hex || '').replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
}

const luminance = (rgb) => {
  const [r, g, b] = rgb.map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two hex colours (1 to 21). Returns null if either is not a valid #rrggbb. */
export const contrastRatio = (a, b) => {
  const ca = parse(a); const cb = parse(b)
  if (!ca || !cb) return null
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Text colour (near-black or white) that reads best on the given background. */
export const readableOn = (background) => {
  const white = contrastRatio(background, '#ffffff') ?? 0
  const dark = contrastRatio(background, '#14181d') ?? 0
  return white >= dark ? '#ffffff' : '#14181D'
}
