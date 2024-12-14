import {useMemo} from 'react'
import zod from 'zod'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export function useVouchRecordSchema() {
  const {_} = useLingui()

  return useMemo(() => {
    return zod.object({
      subject: zod.string().startsWith('did:', { message: _(msg`Must be a valid DID`) }),
      relationship: zod.enum(['verifiedBy', 'employeeOf']),
      createdAt: zod.string().datetime(),
    })
  }, [_])
}
