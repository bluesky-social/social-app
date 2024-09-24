export type Params = Record<string, string>

export function parseSearchQuery(rawQuery: string) {
  let base = rawQuery
  const rawLiterals = rawQuery.match(/".+"/gi) || []

  // remove literals from base
  for (const literal of rawLiterals) {
    base = base.replace(literal, '')
  }

  // find remaining params in base
  const rawParams = base.match(/[a-z]+:[a-z-\.@\d:]+/gi) || []

  for (const param of rawParams) {
    base = base.replace(param, '')
  }

  base = base.trim()

  const params = rawParams.reduce((params, param) => {
    const [name, ...value] = param.split(/:/)
    params[name] = value.join(':') // dates can contain additional colons
    return params
  }, {} as Params)
  const literals = rawLiterals.map(l => String(l))

  return {
    query: [base, literals.join(' ')].filter(Boolean).join(' '),
    params,
  }
}

export function makeSearchQuery(query: string, params: Params) {
  return [
    query,
    Object.entries(params)
      .map(([name, value]) => `${name}:${value}`)
      .join(' '),
  ]
    .filter(Boolean)
    .join(' ')
}
