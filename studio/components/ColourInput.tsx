// A colour choice as swatches from the palette: the built-in colours, with the codes and names
// set in Site settings → Colours, plus the colours added there. Stores the colour's id.
import { useEffect, useState } from 'react'
import { set, unset, useClient, type StringInputProps } from 'sanity'
import { Card, Flex, Text } from '@sanity/ui'
import { BUILTIN_COLOURS, HEX, customId } from '../schemaTypes/palette'

type Item = { _key?: string; builtin?: string; name?: string; code?: string }
type Swatch = { id: string; name: string; code: string }

function merge(items: Item[] = []): Swatch[] {
  const out: Swatch[] = BUILTIN_COLOURS.map(({ id, name, code }) => ({ id, name, code }))
  for (const item of items) {
    const code = (item.code ?? '').trim()
    if (!HEX.test(code)) continue
    const target = item.builtin ? out.find((c) => c.id === item.builtin) : undefined
    if (target) Object.assign(target, { name: item.name || target.name, code })
    else if (item._key) out.push({ id: customId(item._key), name: item.name || code, code })
  }
  return out
}

function usePalette() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [swatches, setSwatches] = useState<Swatch[]>(merge())
  useEffect(() => {
    let live = true
    const load = () =>
      client
        .fetch<{ _id: string; colours?: Item[] }[]>(`*[_id in ["siteSettings", "drafts.siteSettings"]]{_id, colours}`)
        .then((docs) => {
          const doc = docs.find((d) => d._id.startsWith('drafts.')) ?? docs[0]
          if (live) setSwatches(merge(doc?.colours))
        })
        .catch(() => {})
    load()
    const sub = client.listen(`*[_id in ["siteSettings", "drafts.siteSettings"]]`).subscribe(() => setTimeout(load, 500))
    return () => {
      live = false
      sub.unsubscribe()
    }
  }, [client])
  return swatches
}

function Choice(props: { selected: boolean; label: string; code?: string; onClick: () => void }) {
  return (
    <Card
      as="button"
      type="button"
      padding={2}
      radius={2}
      border
      tone={props.selected ? 'primary' : 'default'}
      onClick={props.onClick}
      style={{ cursor: 'pointer', outline: props.selected ? '2px solid currentColor' : undefined }}
    >
      <Flex align="center" gap={2}>
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: props.code ?? 'transparent',
            border: '1px solid rgba(128,128,128,0.6)',
            backgroundImage: props.code ? undefined : 'repeating-linear-gradient(45deg, rgba(128,128,128,.4) 0 3px, transparent 3px 6px)',
          }}
        />
        <Text size={1} weight={props.selected ? 'semibold' : 'regular'}>
          {props.label}
        </Text>
      </Flex>
    </Card>
  )
}

function make(defaultLabel?: string) {
  return function ColourInput(props: StringInputProps) {
    const swatches = usePalette()
    const value = props.value
    const known = !value || value === 'default' || swatches.some((s) => s.id === value)
    return (
      <Flex wrap="wrap" gap={2}>
        {defaultLabel && <Choice selected={!value || value === 'default'} label={defaultLabel} onClick={() => props.onChange(unset())} />}
        {swatches.map((s) => (
          <Choice key={s.id} selected={value === s.id} label={s.name} code={s.code} onClick={() => props.onChange(set(s.id))} />
        ))}
        {!known && <Text size={1} muted>(a colour that was deleted: choose another)</Text>}
      </Flex>
    )
  }
}

/** For a page's colour: one of the palette. */
export const ColourInput = make()
/** For a block's background: "Same as page" or one of the palette. */
export const BlockColourInput = make('Same as page')
/** For the header and the language list: "Default" or one of the palette. */
export const OptionalColourInput = make('Default')
