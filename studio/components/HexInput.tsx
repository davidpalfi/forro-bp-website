// A colour code field with the browser's own colour picker next to it: pick a colour, or type
// or paste a code. Both fill the same field (e.g. #c28f32).
import { set, unset, type StringInputProps } from 'sanity'
import { Flex, Box, TextInput } from '@sanity/ui'
import { HEX } from '../schemaTypes/palette'

/** #abc → #aabbcc; the picker only understands six-digit codes. */
const six = (code: string) =>
  code.length === 4 ? '#' + [...code.slice(1)].map((c) => c + c).join('') : code

export function HexInput(props: StringInputProps) {
  const { value, onChange, elementProps, readOnly } = props
  const code = (value ?? '').trim()
  const valid = HEX.test(code)
  return (
    <Flex gap={2} align="center">
      <input
        type="color"
        aria-label="Pick a colour"
        disabled={readOnly}
        value={valid ? six(code).toLowerCase() : '#ffffff'}
        onChange={(e) => onChange(set(e.currentTarget.value))}
        style={{ width: 44, height: 35, padding: 0, border: '1px solid #ccc', borderRadius: 4, background: 'none', cursor: readOnly ? 'default' : 'pointer', flex: 'none' }}
      />
      <Box flex={1}>
        <TextInput
          {...elementProps}
          value={value ?? ''}
          placeholder="#c28f32"
          onChange={(e) => {
            const v = e.currentTarget.value
            onChange(v ? set(v) : unset())
          }}
        />
      </Box>
    </Flex>
  )
}
