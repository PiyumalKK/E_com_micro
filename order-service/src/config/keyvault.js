const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const SECRET_MAPPINGS = {
  'order-mongodb-uri': 'MONGODB_URI',
  'jwt-secret': 'JWT_SECRET',
  'servicebus-connection-string': 'SERVICE_BUS_CONNECTION_STRING'
};

async function loadSecrets() {
  const vaultUrl = process.env.KEY_VAULT_URL;
  if (!vaultUrl) {
    console.log('KEY_VAULT_URL not set, using environment variables');
    return;
  }

  try {
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(vaultUrl, credential);

    for (const [secretName, envVar] of Object.entries(SECRET_MAPPINGS)) {
      try {
        const secret = await client.getSecret(secretName);
        process.env[envVar] = secret.value;
        console.log(`Loaded secret: ${secretName}`);
      } catch (err) {
        console.warn(`Failed to load secret ${secretName}: ${err.message}`);
      }
    }
    console.log('Key Vault secrets loaded successfully');
  } catch (err) {
    console.error('Key Vault initialization failed:', err.message);
    console.log('Falling back to environment variables');
  }
}

module.exports = { loadSecrets };
