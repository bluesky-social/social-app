const {readFileSync} = require('node:fs')
const yaml = require('js-yaml')
const workflow = yaml.load(
  readFileSync('.github/workflows/prepare-cactus-release.yml', 'utf8'),
)
const script = workflow.jobs.preview.steps.find(step => step.with?.script).with
  .script
const definitions = script.split(
  '// Run preparation with the authenticated Actions client.',
)[0]
module.exports = new Function(
  'require',
  `${definitions}
return {prepareRelease, renderReport, checkGitHub, dryRunRelease, buildWorkflows, workflowHashes, executeRelease, createReleaseDocument, deriveReleaseIdentity}`,
)(require)
