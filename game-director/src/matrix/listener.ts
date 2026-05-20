/**
 * Subscribe to room timelines and route m.text events to a handler.
 */
import type * as sdk from 'matrix-js-sdk';

export interface InboundMessage {
  roomId: string;
  eventId: string;
  sender: string;
  ts: number;
  body: string;
}

export type Listener = (msg: InboundMessage) => void;

export function attachTimelineListener(
  client: sdk.MatrixClient,
  listener: Listener,
): () => void {
  // Room.timeline signature: (event, room, toStartOfTimeline, removed).
  // Skip removed events to avoid duplicates from local-echo replacement.
  const handler = (
    event: sdk.MatrixEvent,
    room: sdk.Room | undefined,
    _toStartOfTimeline: boolean | undefined,
    removed: boolean,
  ) => {
    if (removed) return;
    if (event.getType() !== 'm.room.message') return;
    if (!room) return;
    const content = event.getContent<{ msgtype?: string; body?: string }>();
    if (content.msgtype !== 'm.text') return;
    listener({
      roomId: room.roomId,
      eventId: event.getId() ?? '',
      sender: event.getSender() ?? '',
      ts: event.getTs(),
      body: content.body ?? '',
    });
  };
  (client as unknown as { on: (e: string, h: typeof handler) => void }).on('Room.timeline', handler);
  return () => {
    (client as unknown as { removeListener: (e: string, h: typeof handler) => void }).removeListener(
      'Room.timeline',
      handler,
    );
  };
}
