const exec = require('child_process').execSync

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN

module.exports = ({config}) => {
  if (!SENTRY_AUTH_TOKEN) {
    console.log(
      'SENTRY_AUTH_TOKEN environment variable must be set to upload sourcemaps. Skipping.',
    )
    return
  }

  const org = config.organization
  const project = config.project
  const release = config.release
  const dist = config.dist

  if (!org || !project || !release || !dist) {
    console.log(
      '"organization", "project", "release", and "dist" must be set in the hook config to upload sourcemaps. Skipping.',
    )
    return
  }

  try {
    console.log('Uploading sourcemaps to Sentry...')
    exec(
      `node node_modules/@sentry/react-native/scripts/expo-upload-sourcemaps dist --url https://sentry.io/  -o ${org} -p ${project} -r ${release} -d ${dist}`,
    )
    console.log('Sourcemaps uploaded to Sentry.')
  } catch (e) {
    console.error('Error uploading sourcemaps to Sentry:', e)
  }
}
