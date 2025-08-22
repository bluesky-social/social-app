// Utility to get the correct app namespace from the agent
export function getAppNS(agent: any) {
  // Prefer gndr, fallback to bsky
  return agent.app?.gndr ?? agent.app?.bsky;
}

