import {type Route, type RouteParams} from './types'

export class Router<T extends Record<string, any>> {
  routes: [string, Route][] = []
  constructor(description: Record<keyof T, string | string[]>) {
    for (const [screen, pattern] of Object.entries(description)) {
      if (typeof pattern === 'string') {
        this.routes.push([screen, createRoute(pattern)])
      } else {
        pattern.forEach(subPattern => {
          this.routes.push([screen, createRoute(subPattern)])
        })
      }
    }
  }

  matchName(name: keyof T | (string & {})): Route | undefined {
    for (const [screenName, route] of this.routes) {
      if (screenName === name) {
        return route
      }
    }
  }

  matchPath(path: string): [string, RouteParams] {
    let name = 'NotFound'
    let params: RouteParams = {}
    for (const [screenName, route] of this.routes) {
      const res = route.match(path)
      if (res) {
        name = screenName
        params = res.params
        break
      }
    }
    return [name, params]
  }
}

function createRoute(pattern: string): Route {
  const pathParamNames: Set<string> = new Set()
  let matcherReInternal = pattern.replace(/:([\w]+)/g, (_m, name) => {
    pathParamNames.add(name)
    return `(?<${name}>[^/]+)`
  })
  const matcherRe = new RegExp(`^${matcherReInternal}([?]|$)`, 'i')
  return {
    match(path) {
      const {pathname, searchParams} = new URL(path, 'http://throwaway.com')
      const addedParams = Object.fromEntries(searchParams.entries())

      const res = matcherRe.exec(pathname)
      if (res) {
        return {params: Object.assign(addedParams, res.groups || {})}
      }
      return undefined
    },
    build(params = {}) {
      const str = pattern.replace(
        /:([\w]+)/g,
        (_m, name) => params[encodeURIComponent(name)] || 'undefined',
      )

      let hasQp = false
      const qp = new URLSearchParams()
      for (const paramName in params) {
        if (!pathParamNames.has(paramName)) {
          qp.set(paramName, params[paramName])
          hasQp = true
        }
      }

      return str + (hasQp ? `?${qp.toString()}` : '')
    },
  }
}
