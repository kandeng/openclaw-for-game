/**
 * Outbound dispatcher: send plain text chat messages via Matrix.
 */
import type * as sdk from 'matrix-js-sdk';

export async function sendChat(
  client: sdk.MatrixClient,
  roomId: string,
  text: string,
): Promise<void> {
  await client.sendTextMessage(roomId, text);
}
