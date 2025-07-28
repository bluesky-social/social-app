// Utility to get the correct app namespace from the agent
export function getAppNS(agent: any) {
  // Prefer gndr, fallback to gndr
  return agent.app?.gndr ?? agent.app?.gndr
}
