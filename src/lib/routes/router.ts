import {RouteParams, Route} from './types'

export class Router {
  routes: [string, Route][] = []
  constructor(description: Record<string, string>) {
    for (const [screen, pattern] of Object.entries(description)) {
      this.routes.push([screen, createRoute(pattern)])
    }
  }

  matchName(name: string): Route | undefined {
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
  let matcherReInternal = pattern.replace(
    /:([\w]+)/g,
    (_m, name) => `(?<${name}>[^/]+)`,
  )
  const matcherRe = new RegExp(`^${matcherReInternal}([?]|$)`, 'i')
  return {
    match(path: string) {
      const res = matcherRe.exec(path)
      if (res) {
        return {params: res.groups || {}}
      }
      return undefined
    },
    build(params: Record<string, string>) {
      return pattern.replace(
        /:([\w]+)/g,
        (_m, name) => params[name] || 'undefined',
      )
    },
  }
}
