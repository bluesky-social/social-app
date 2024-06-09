import {z} from 'zod'

export const gap = z
  .number()
  .optional()
  .transform(v => ({gap: v}))

export const pad = z
  .union([
    z
      .number()
      .positive()
      .transform(v => ({padding: v})),
    z
      .object({
        x: z.number().positive().optional(),
        y: z.number().positive().optional(),
        t: z.number().positive().optional(),
        b: z.number().positive().optional(),
        l: z.number().positive().optional(),
        r: z.number().positive().optional(),
      })
      .transform(obj => ({
        paddingHorizontal: obj.x,
        paddingVertical: obj.y,
        paddingTop: obj.t,
        paddingBottom: obj.b,
        paddingLeft: obj.l,
        paddingRight: obj.r,
      })),
  ])
  .optional()

export const color = z
  .enum(['default', 'primary', 'secondary', 'positive', 'negative', 'inverted'])
  .default('default')
