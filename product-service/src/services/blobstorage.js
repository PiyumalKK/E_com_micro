const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

let containerClient = null;

async function initBlobStorage() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'product-images';

  if (!connectionString) {
    console.log('AZURE_STORAGE_CONNECTION_STRING not set, blob storage disabled');
    return false;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: 'blob' });
    console.log(`Blob Storage initialized (container: ${containerName})`);
    return true;
  } catch (err) {
    console.error('Blob Storage initialization failed:', err.message);
    return false;
  }
}

function isBlobStorageEnabled() {
  return containerClient !== null;
}

async function uploadImage(buffer, originalName, mimeType) {
  if (!containerClient) return null;

  const ext = originalName.split('.').pop().toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  if (!allowedExtensions.includes(ext)) {
    throw new Error('Invalid file type. Allowed: jpg, jpeg, png, gif, webp');
  }

  const blobName = `${uuidv4()}.${ext}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: mimeType }
  });

  return blockBlobClient.url;
}

async function deleteImage(blobUrl) {
  if (!containerClient || !blobUrl) return;
  try {
    const url = new URL(blobUrl);
    const blobName = url.pathname.split('/').pop();
    await containerClient.getBlockBlobClient(blobName).deleteIfExists();
    console.log(`[Blob] Deleted: ${blobName}`);
  } catch (err) {
    console.error('Failed to delete blob:', err.message);
  }
}

module.exports = { initBlobStorage, isBlobStorageEnabled, uploadImage, deleteImage };
