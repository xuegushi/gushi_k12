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
  radical?: string
  words?: string[]
  explain?: string
}

export function getCharInfo(char: string): CharDetail | null {
  if (!char || char.length === 0) return null

  var p = pinyin(char, { toneType: 'symbol' })
  var stroke = cnchar.stroke(char)
  var radical: string | undefined
  var words: string[] | undefined
  var explain: string | undefined

  try {
    var r = cnchar.radical(char)
    if (r) radical = String(r)
  } catch (e) { /* plugin not available */ }

  try {
    var w = cnchar.words(char)
    if (w && Array.isArray(w) && w.length > 0) words = w.slice(0, 10)
  } catch (e) { /* plugin not available */ }

  try {
    var ex = cnchar.explain(char)
    if (ex) explain = String(ex)
  } catch (e) { /* plugin not available */ }

  return {
    char,
    pinyin: p,
    strokeCount: stroke,
    radical,
    words,
    explain,
  }
}

export function getPhrasePinyin(text: string) {
  return pinyin(text, { toneType: 'symbol', type: 'array' })
}
