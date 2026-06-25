import cnchar from 'cnchar'
import 'cnchar-order'
import 'cnchar-radical'
import 'cnchar-words'
import 'cnchar-explain'
import { pinyin } from 'pinyin-pro'

export interface CharDetail {
  char: string
  pinyin: string
  strokeCount: number
  strokeOrder?: string[]
  radical?: string
  words?: string[]
  explain?: string
}

export function getCharInfo(char: string): CharDetail | null {
  if (!char || char.length === 0) return null

  var p = pinyin(char, { toneType: 'symbol' })
  var stroke = cnchar.stroke(char)
  var strokeOrder: string[] | undefined
  var radical: string | undefined
  var words: string[] | undefined
  var explain: string | undefined

  try {
    var r = cnchar.radical(char)
    if (r) {
      if (typeof r === 'string') radical = r
      else if (Array.isArray(r) && r.length > 0) {
        var item = r[0]
        radical = typeof item === 'string' ? item : String(item[char]?.radical || item[char] || '')
      }
    }
  } catch (e) { /* plugin not available */ }

  try {
    var w = cnchar.words(char)
    if (w && Array.isArray(w) && w.length > 0) words = w.slice(0, 10)
  } catch (e) { /* plugin not available */ }

  try {
    var order = cnchar.stroke(char, 'order', 'shape')
    if (order && Array.isArray(order) && order.length > 0) {
      var shapes = order[0]
      if (Array.isArray(shapes)) strokeOrder = shapes
    }
  } catch (e) { /* plugin not available */ }

  try {
    var ex = cnchar.explain(char)
    if (ex) {
      if (typeof ex === 'string') explain = ex
      else if (Array.isArray(ex)) explain = ex.map(function(e: any) { return typeof e === 'string' ? e : String(e[char] || '') }).filter(Boolean).join('；')
    }
  } catch (e) { /* plugin not available */ }

  return {
    char,
    pinyin: p,
    strokeCount: typeof stroke === 'number' ? stroke : 0,
    strokeOrder,
    radical,
    words,
    explain,
  }
}

export function getPhrasePinyin(text: string) {
  return pinyin(text, { toneType: 'symbol', type: 'array' })
}
