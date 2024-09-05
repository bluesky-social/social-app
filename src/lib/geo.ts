import {emitGeoUpdated} from '#/state/events'

let geo: any

export async function resolveGeo() {
  const req = new Promise(y => {
    setTimeout(() => {
      try {
        geo = {country_code: 'US'}
        emitGeoUpdated({geo})
      } catch (e) {
      } finally {
        y(0)
      }
    }, 1000)
  })

  if (!geo) {
    await req
  }
}

export function getGeo() {
  return geo
}
