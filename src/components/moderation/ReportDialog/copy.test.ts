import {renderHook} from '@testing-library/react-native'

import {useCopyForSubject} from './copy'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))

const ref = {uri: 'at://did:plc:x/app.test.thing/3k', cid: 'cid', nsid: 'a.b.c'}

it.each(['article', 'photo'] as const)(
  'words %s reports for that content',
  type => {
    const {result} = renderHook(() => useCopyForSubject({type, ...ref}))
    expect(result.current).toEqual({
      title: `Report this ${type}`,
      subtitle: `Why should this ${type} be reviewed?`,
    })
  },
)
