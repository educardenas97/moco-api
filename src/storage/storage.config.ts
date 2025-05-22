const StorageConfig = {
  projectId: process.env.GCP_PROJECT_ID,
  // private_key: process.env.PRIVATE_KEY,
  // client_email: process.env.CLIENT_EMAIL,
  mediaBucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
};

export const load = () => StorageConfig;

export default StorageConfig;
