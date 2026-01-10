import { Client, Account, Databases } from 'appwrite';

// Appwrite configuration - user will need to provide these values
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

const client = new Client();

if (APPWRITE_PROJECT_ID) {
  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
}

export const account = new Account(client);
export const databases = new Databases(client);
export { client };

export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
export const APPWRITE_LISTINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LISTINGS_COLLECTION_ID || '';
