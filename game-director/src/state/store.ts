/**
 * UI store: creds, Matrix client, rooms, and chat log.
 */
import { create } from 'zustand';
import type * as sdk from 'matrix-js-sdk';
import type { ClientCreds } from '../matrix/client';
import type { InboundMessage } from '../matrix/listener';

export interface UIRoom {
  roomId: string;
  name: string;
}

interface State {
  creds: ClientCreds | null;
  client: sdk.MatrixClient | null;
  rooms: UIRoom[];
  selectedRoomId: string | null;
  log: InboundMessage[];
  setCreds: (c: ClientCreds | null) => void;
  setClient: (c: sdk.MatrixClient | null) => void;
  setRooms: (rs: UIRoom[]) => void;
  selectRoom: (id: string | null) => void;
  pushMessage: (m: InboundMessage) => void;
}

export const useStore = create<State>((set) => ({
  creds: null,
  client: null,
  rooms: [],
  selectedRoomId: null,
  log: [],
  setCreds: (creds) => set({ creds }),
  setClient: (client) => set({ client }),
  setRooms: (rooms) => set({ rooms }),
  selectRoom: (selectedRoomId) => set({ selectedRoomId }),
  pushMessage: (msg) =>
    set((s) => {
      if (s.log.some((m) => m.eventId === msg.eventId)) return s;
      return { log: [...s.log.slice(-499), msg] };
    }),
}));
