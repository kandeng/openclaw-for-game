import { useState, useRef, useCallback, useEffect } from 'react';
import type * as sdk from 'matrix-js-sdk';
import ThreeScene from './components/ThreeScene';
import Joystick from './components/Joystick';
import ChatPanel from './components/ChatPanel';
import HUD from './components/HUD';
import Login from './components/Login';
import { useStore } from './state/store';
import { createClient, loadCreds } from './matrix/client';
import { attachTimelineListener } from './matrix/listener';

const SERVER_NAME = 'matrix.openclaw.local';
const SHARED_ALIAS = '#alice-bob:' + SERVER_NAME;
const AI_DIRECTOR_ID = '@ai_director:' + SERVER_NAME;
const HUMAN_DIRECTOR_ID = '@human_director:' + SERVER_NAME;

async function ensureSharedRoom(
  client: sdk.MatrixClient,
): Promise<string | null> {
  try {
    const res = await client.joinRoom(SHARED_ALIAS);
    const roomId =
      (res as { room_id?: string }).room_id ??
      (res as { roomId?: string }).roomId ??
      null;
    if (roomId) {
      inviteParticipants(client, roomId);
      return roomId;
    }
  } catch {
    // Room not found yet — fall through to create
  }
  try {
    const res = await Promise.race([
      client.createRoom({
        name: 'Alice-Bob Chat',
        preset: 'public_chat' as never,
        room_alias_name: 'alice-bob',
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('createRoom timeout')), 5000),
      ),
    ]);
    const roomId =
      (res as { room_id?: string }).room_id ??
      (res as { roomId?: string }).roomId ??
      null;

    if (roomId) inviteParticipants(client, roomId);
    return roomId;
  } catch {
    // Race: another client may have created it while we tried
    try {
      const res = await client.joinRoom(SHARED_ALIAS);
      const roomId =
        (res as { room_id?: string }).room_id ??
        (res as { roomId?: string }).roomId ??
        null;
      if (roomId) {
        inviteParticipants(client, roomId);
        return roomId;
      }
    } catch {
      // fall through
    }
    return null;
  }
}

async function inviteParticipants(client: sdk.MatrixClient, roomId: string): Promise<void> {
  for (const userId of [AI_DIRECTOR_ID, HUMAN_DIRECTOR_ID]) {
    try {
      await client.invite(roomId, userId);
      
    } catch {
      // Already invited or already joined — not an error
    }
  }
}

export interface EntityState {
  x: number;
  y: number;
  z: number;
  yaw: number;
  focal: number;
}

function App() {
  const creds = useStore((s) => s.creds);
  const setCreds = useStore((s) => s.setCreds);
  const setClient = useStore((s) => s.setClient);
  const setRooms = useStore((s) => s.setRooms);
  const selectRoom = useStore((s) => s.selectRoom);
  const clientRef = useRef<sdk.MatrixClient | null>(null);

  const [entityState, setEntityState] = useState<EntityState>({
    x: 0,
    y: 0,
    z: 2.4,
    yaw: 180,
    focal: 2.0,
  });

  // Bootstrap creds from localStorage
  useEffect(() => {
    if (!creds) {
      const stored = loadCreds();
      if (stored) setCreds(stored);
    }
  }, [creds, setCreds]);

  // Bring up Matrix client when creds available (StrictMode-safe via ref)
  useEffect(() => {
    if (!creds) return;
    if (clientRef.current) return;
    const c = createClient(creds);
    clientRef.current = c;
    setClient(c);
    let stopped = false;
    c.startClient({ initialSyncLimit: 20 }).then(async () => {
      if (stopped) return;
      const rs = c.getRooms().map((r) => ({
        roomId: r.roomId,
        name: r.name ?? r.roomId,
      }));
      setRooms(rs);
      // Auto-create or auto-join the alice-bob shared room
      const dmRoomId = await ensureSharedRoom(c);
      if (dmRoomId) {
        selectRoom(dmRoomId);
        // Refresh rooms list after possible join/create
        const refreshed = c.getRooms().map((r) => ({
          roomId: r.roomId,
          name: r.name ?? r.roomId,
        }));
        setRooms(refreshed);
      } else if (rs.length > 0) {
        selectRoom(rs[0].roomId);
      }

      // Replay existing timeline so user sees prior messages immediately
      const store = useStore.getState();
      const seen = new Set(store.log.map((m) => m.eventId));
      for (const room of c.getRooms()) {
        for (const ev of room.getLiveTimeline().getEvents()) {
          if (ev.getType() !== 'm.room.message') continue;
          const content = ev.getContent<{ msgtype?: string; body?: string }>();
          if (content.msgtype !== 'm.text') continue;
          const eid = ev.getId() ?? '';
          if (seen.has(eid)) continue;
          seen.add(eid);
          store.pushMessage({
            roomId: room.roomId,
            eventId: eid,
            sender: ev.getSender() ?? '',
            ts: ev.getTs(),
            body: content.body ?? '',
          });
        }
      }
    });
    const detach = attachTimelineListener(c, (msg) => {
      useStore.getState().pushMessage(msg);
    });
    return () => {
      stopped = true;
      detach();
      c.stopClient();
      clientRef.current = null;
      setClient(null);
    };
  }, [creds, setClient, setRooms, selectRoom]);

  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [chatHeight, setChatHeight] = useState(30); // vh percentage
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(30);
  const isDraggingPanel = useRef(false);

  const velocityRef = useRef({ vx: 0, vy: 0, vyaw: 0, vz: 0, vf: 0 });
  const animFrameRef = useRef<number>(0);

  // Persistent movement loop
  const startLoop = useCallback(() => {
    if (animFrameRef.current) return;
    const tick = () => {
      const { vx, vy, vyaw, vz, vf } = velocityRef.current;
      if (vx !== 0 || vy !== 0 || vyaw !== 0 || vz !== 0 || vf !== 0) {
        setEntityState((prev) => ({
          ...prev,
          x: parseFloat((prev.x + vx * 0.016).toFixed(2)),
          y: parseFloat((prev.y + vy * 0.016).toFixed(2)),
          yaw: (prev.yaw + vyaw * 0.016 + 360) % 360,
          z: Math.max(0.5, Math.min(10, parseFloat((prev.z + vz * 0.016).toFixed(2)))),
          focal: Math.max(1, Math.min(10, parseFloat((prev.focal + vf * 0.016).toFixed(1)))),
        }));
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAll = useCallback(() => {
    velocityRef.current = { vx: 0, vy: 0, vyaw: 0, vz: 0, vf: 0 };
  }, []);

  const setVelocity = useCallback(
    (vx: number, vy: number) => {
      velocityRef.current.vx = vx;
      velocityRef.current.vy = vy;
      startLoop();
    },
    [startLoop]
  );

  const setYawVelocity = useCallback(
    (vyaw: number) => {
      velocityRef.current.vyaw = vyaw;
      startLoop();
    },
    [startLoop]
  );

  const setHeightVelocity = useCallback(
    (vz: number) => {
      velocityRef.current.vz = vz;
      startLoop();
    },
    [startLoop]
  );

  const setFocalVelocity = useCallback(
    (vf: number) => {
      velocityRef.current.vf = vf;
      startLoop();
    },
    [startLoop]
  );

  const handlePanelDragStart = useCallback((e: React.TouchEvent) => {
    isDraggingPanel.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = chatHeight;
  }, [chatHeight]);

  const handlePanelDragMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingPanel.current) return;
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.max(15, Math.min(60, dragStartHeight.current + deltaVh));
    setChatHeight(newHeight);
  }, []);

  const handlePanelDragEnd = useCallback(() => {
    if (!isDraggingPanel.current) return;
    isDraggingPanel.current = false;
    // Snap to nearest position: 15, 30, or 50
    setChatHeight((h) => {
      if (h < 22) return 15;
      if (h < 40) return 30;
      return 50;
    });
  }, []);

  if (!creds) return <Login />;

  return (
    <div className="flex flex-col w-screen overflow-hidden bg-gray-100 select-none" style={{ height: '100dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Main Viewport */}
      <div
        className="relative w-full flex-shrink-0 touch-none"
        style={{ height: `${100 - chatHeight}vh` }}
      >
        {/* 3D Scene background */}
        <ThreeScene entityState={entityState} />

        {/* Telemetry HUD overlay */}
        <HUD entityState={entityState} />

        {/* Joystick overlay */}
        <Joystick
          onMove={setVelocity}
          onRotate={setYawVelocity}
          onHeight={setHeightVelocity}
          onFocal={setFocalVelocity}
          onStop={stopAll}
        />
      </div>

      {/* Chat & Toolbox Panel */}
      <div
        className="relative w-full flex-grow overflow-hidden"
        style={{ height: `${chatHeight}vh` }}
        onTouchStart={handlePanelDragStart}
        onTouchMove={handlePanelDragMove}
        onTouchEnd={handlePanelDragEnd}
      >
        <ChatPanel
          toolboxOpen={toolboxOpen}
          onToggleToolbox={() => setToolboxOpen(!toolboxOpen)}
        />
      </div>
    </div>
  );
}

export default App;
