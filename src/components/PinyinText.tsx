import { useMemo } from 'react'
import { pinyin } from 'pinyin-pro'

function decodeHtml(text: string): string {
  if (typeof document === 'undefined') return text
  var el = document.createElement('textarea')
  el.innerHTML = text
  return el.value
}

export interface PinyinTextProps {
  text: string
  show: boolean
}

export function PinyinText({ text, show }: PinyinTextProps) {
  var cleanText = useMemo(function() { return decodeHtml(text) }, [text])

  var pairs = useMemo(function() {
    var result = pinyin(cleanText, { type: 'all' }) as Array<{
      origin: string
      pinyin: string
      isZh: boolean
    }>
    var pairs: Array<[string, string]> = []
    for (var item of result) {
      for (var ch of item.origin) {
        if (ch === ' ') continue
        pairs.push([ch, item.isZh ? item.pinyin : ''])
      }
    }
    return pairs
  }, [cleanText])

  return (
    <span className="inline">
      {pairs.map(function([ch, py], i) {
        if (!py) {
          return <span key={i}>{ch}</span>
        }
        return (
          <span key={i} className="inline-flex flex-col items-center mx-[1px] align-middle">
            {show && <span className="text-[10px] leading-none text-muted-foreground mb-px">{py}</span>}
            <span className="leading-tight">{ch}</span>
          </span>
        )
      })}
    </span>
  )
}
