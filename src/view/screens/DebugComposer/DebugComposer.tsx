/**
 * Thin legacy-route wrapper. The full ComposerV2 tester lives next to the
 * composer code at `#/components/ComposerV2/tester`.
 */
import {ComposerV2Tester} from '#/components/ComposerV2/tester'

export default function DebugComposer() {
  return <ComposerV2Tester />
}
