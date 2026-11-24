// The palette list in Site settings → Colours, with a button that adds the built-in colours
// (with their current codes) so they can be changed here.
import { set, type ArrayOfObjectsInputProps } from 'sanity'
import { Box, Button, Stack, Text } from '@sanity/ui'
import { BUILTIN_COLOURS } from '../schemaTypes/palette'

export function ColoursArrayInput(props: ArrayOfObjectsInputProps) {
  const items = (props.value ?? []) as { builtin?: string }[]
  const missing = BUILTIN_COLOURS.filter((b) => !items.some((i) => i.builtin === b.id))
  return (
    <Stack space={4}>
      <Box>{props.renderDefault(props)}</Box>
      {missing.length > 0 && (
        <Stack space={3} paddingTop={2}>
          <Text size={1} muted style={{ lineHeight: 1.5 }}>
            Built-in colours not listed here use their usual codes: {missing.map((m) => `${m.name} ${m.code}`).join(', ')}.
          </Text>
          <Button
            style={{ alignSelf: 'flex-start' }}
            mode="ghost"
            text="Add the built-in colours to change their codes"
            onClick={() =>
              props.onChange(
                set([
                  ...(props.value ?? []),
                  ...missing.map((b) => ({ _type: 'paletteColour', _key: b.id, builtin: b.id, name: b.name, code: b.code, text: b.text })),
                ]),
              )
            }
          />
        </Stack>
      )}
    </Stack>
  )
}
