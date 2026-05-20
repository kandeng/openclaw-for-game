/**
 * Matrix client factory for the mobile game PWA. E2EE is OFF.
 */
import * as sdk from 'matrix-js-sdk';

export interface ClientCreds {
  homeserverUrl: string;
  userId: string;
  accessToken: string;
  deviceId: string;
}

const STORAGE_KEY = 'mobile-game-pwa.matrix.creds';

export function loadCreds(): ClientCreds | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClientCreds;
  } catch {
    return null;
  }
}

export function saveCreds(creds: ClientCreds): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export function clearCreds(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function login(
  homeserverUrl: string,
  username: string,
  password: string,
): Promise<ClientCreds> {
  const tmp = sdk.createClient({ baseUrl: homeserverUrl });
  const res = await tmp.login('m.login.password', {
    user: username,
    password,
    initial_device_display_name: 'Game Director',
  });
  return {
    homeserverUrl,
    userId: res.user_id,
    accessToken: res.access_token,
    deviceId: res.device_id,
  };
}

export function createClient(creds: ClientCreds): sdk.MatrixClient {
  return sdk.createClient({
    baseUrl: creds.homeserverUrl,
    userId: creds.userId,
    accessToken: creds.accessToken,
    deviceId: creds.deviceId,
    // Use MemoryStore to avoid IndexedDB init bugs in matrix-js-sdk v34.
    // Timeline state is not persisted across reloads, but sync is reliable.
    store: new sdk.MemoryStore(),
  });
}
