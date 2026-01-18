import psl from 'psl'

/**
 * NOTE: Expensive import! Try to lazy load when using it.
 */
export function splitApexDomain(hostname: string): [string, string] {
  const hostnamep = psl.parse(hostname)
  if (hostnamep.error || !hostnamep.listed || !hostnamep.domain) {
    return ['', hostname]
  }
  return [
    hostnamep.subdomain ? `${hostnamep.subdomain}.` : '',
    hostnamep.domain,
  ]
}
