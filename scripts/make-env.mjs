import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'
import fs from 'fs'

const client = new SecretsManagerClient({
  region: 'us-east-2',
})

// Function to retrieve the SENTRY_AUTH_TOKEN from AWS Secret Manager
async function fetchSentryAuthToken() {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: 'dev/w2-client/SENTRY_AUTH_TOKEN',
        VersionStage: 'AWSCURRENT',
      }),
    )
    // Parse the JSON secret value response
    const secretValue = JSON.parse(response.SecretString)

    // Get the SENTRY_AUTH_TOKEN from the secret value
    const sentryAuthToken = secretValue.SENTRY_AUTH_TOKEN

    // Create the content for the .env file
    const envContent = `SENTRY_AUTH_TOKEN=${sentryAuthToken}`

    // Write the .env file
    fs.writeFileSync('.env', envContent)

    console.log('.env file created successfully')
  } catch (error) {
    console.error('Error retrieving secret:', error)
  }
}

// Call the function to fetch the SENTRY_AUTH_TOKEN
fetchSentryAuthToken()
