import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("game-control-app")
class GameControlApp extends LitElement {
  @state() private _feedback = "";
  @state() private _inputValue = "";
  @state() private _wsStatus = "disconnected";
  @state() private _imageUrl = "";
  @state() private _hookResponse = "";

  private _ws: WebSocket | null = null;
  private _rpcId = 0;
  private _pendingRpc = new Map<string, (data: unknown) => void>();

  static override styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: #0a0e14;
      color: #e0e8f0;
      font-family: "JetBrains Mono", "Fira Code", monospace;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
      border-bottom: 1px solid rgba(99, 179, 237, 0.2);
      margin-bottom: 32px;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #63b3ed;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      background: rgba(72, 187, 120, 0.15);
      border: 1px solid rgba(72, 187, 120, 0.4);
      font-size: 0.8rem;
      color: #48bb78;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #48bb78;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .message-box {
      background: #151b23;
      border: 1px solid rgba(99, 179, 237, 0.15);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .message-box h2 {
      margin: 0 0 16px;
      font-size: 1rem;
      font-weight: 600;
      color: #90cdf4;
    }

    .message-form {
      display: flex;
      gap: 12px;
    }

    .message-input {
      flex: 1;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid rgba(99, 179, 237, 0.3);
      background: #0a0e14;
      color: #e0e8f0;
      font-family: inherit;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .message-input:focus {
      border-color: #63b3ed;
    }

    .message-input::placeholder {
      color: #4a5568;
    }

    .send-btn {
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      background: #63b3ed;
      color: #0a0e14;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .send-btn:hover {
      background: #90cdf4;
    }

    .send-btn:active {
      background: #4299e1;
    }

    .feedback {
      margin-top: 12px;
      font-size: 0.85rem;
      color: #48bb78;
      min-height: 1.2em;
    }

    .feedback.error {
      color: #fc8181;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .panel {
      background: #151b23;
      border: 1px solid rgba(99, 179, 237, 0.15);
      border-radius: 12px;
      padding: 24px;
    }

    .panel h2 {
      margin: 0 0 16px;
      font-size: 1rem;
      font-weight: 600;
      color: #90cdf4;
    }

    .panel p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.6;
      color: #a0aec0;
    }

    .hello-world {
      text-align: center;
      padding: 60px 20px;
    }

    .hello-world h2 {
      font-size: 2.5rem;
      color: #63b3ed;
      margin: 0 0 16px;
    }

    .hello-world p {
      font-size: 1.1rem;
      color: #a0aec0;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.7;
    }

    .fetch-box {
      background: #151b23;
      border: 1px solid rgba(99, 179, 237, 0.15);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .fetch-box h2 {
      margin: 0 0 16px;
      font-size: 1rem;
      font-weight: 600;
      color: #90cdf4;
    }

    .fetch-btn {
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      background: #ed8936;
      color: #0a0e14;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .fetch-btn:hover {
      background: #f6ad55;
    }

    .fetch-btn:active {
      background: #dd6b20;
    }

    .fetch-btn:disabled {
      background: #4a5568;
      cursor: not-allowed;
    }

    .ws-status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      margin-left: 12px;
    }

    .ws-status.connected {
      background: rgba(72, 187, 120, 0.15);
      color: #48bb78;
    }

    .ws-status.disconnected {
      background: rgba(252, 129, 129, 0.15);
      color: #fc8181;
    }

    .ws-status.connecting {
      background: rgba(237, 137, 54, 0.15);
      color: #ed8936;
    }

    .hook-response {
      margin-top: 12px;
      padding: 12px;
      background: #0a0e14;
      border-radius: 8px;
      font-size: 0.8rem;
      color: #a0aec0;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 120px;
      overflow-y: auto;
    }

    .image-container {
      margin-top: 16px;
      text-align: center;
    }

    .image-container img {
      max-width: 100%;
      max-height: 500px;
      border-radius: 8px;
      border: 1px solid rgba(99, 179, 237, 0.2);
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this._connectWebSocket();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
  }

  private _connectWebSocket() {
    this._wsStatus = "connecting";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string);
        // Handle connect.challenge: gateway sends this before accepting connect
        if (data.type === "event" && data.event === "connect.challenge") {
          const nonce = data.payload?.nonce;
          if (nonce) {
            // Send connect handshake after receiving challenge
            const handshake = {
              type: "req",
              method: "connect",
              id: this._nextRpcId(),
              params: {
                minProtocol: 3,
                maxProtocol: 4,
                client: {
                  id: "openclaw-control-ui",
                  version: "1.0.0",
                  platform: "web",
                  mode: "ui",
                },
                auth: { token: "game-control-2026" },
                scopes: ["operator.write"],
              },
            };
            ws.send(JSON.stringify(handshake));
          }
          return;
        }
        if (data.type === "res") {
          // Check if this is the connect handshake response
          if (data.ok && this._wsStatus === "connecting") {
            this._wsStatus = "connected";
          }
          // Resolve pending RPC
          const resolver = this._pendingRpc.get(data.id);
          if (resolver) {
            this._pendingRpc.delete(data.id);
            resolver(data);
          }
        } else if (data.type === "push") {
          // Handle push messages from hooks
          this._handlePushMessage(data);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      this._wsStatus = "disconnected";
      this._ws = null;
      // Reconnect after delay
      setTimeout(() => this._connectWebSocket(), 3000);
    };

    ws.onerror = () => {
      this._wsStatus = "disconnected";
    };

    this._ws = ws;
  }

  private _nextRpcId(): string {
    return `rpc-${++this._rpcId}-${Date.now()}`;
  }

  private _sendRpc(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }
      const id = this._nextRpcId();
      const frame = { type: "req", method, id, params };
      this._pendingRpc.set(id, resolve as (data: unknown) => void);
      this._ws.send(JSON.stringify(frame));
      // Timeout after 30s
      setTimeout(() => {
        if (this._pendingRpc.has(id)) {
          this._pendingRpc.delete(id);
          reject(new Error("RPC timeout"));
        }
      }, 30000);
    });
  }

  private _handlePushMessage(data: { event?: string; payload?: unknown }) {
    // Hook responses may arrive as push messages
    if (data.payload) {
      this._hookResponse = JSON.stringify(data.payload, null, 2);
    }
  }

  private async _handleFetch3DGS() {
    this._hookResponse = "Fetching 3DGS scene: architecture...";
    this._imageUrl = "";

    try {
      const res = await fetch("./api/fetch-3dgs?scene=architecture");
      const data = await res.json() as { ok: boolean; status?: string; sceneId?: string; assetUrl?: string; path?: string; title?: string; error?: string };

      if (data.ok && data.status === "success") {
        this._hookResponse = JSON.stringify(data, null, 2);
        if (data.assetUrl) {
          this._imageUrl = data.assetUrl;
        }
      } else {
        this._hookResponse = `Error: ${data.error || "scene not found"}`;
        // Fallback: try the asset endpoint directly
        this._imageUrl = "./api/game-asset?file=openclaw_for_game_architecture.png";
      }
    } catch (err) {
      this._hookResponse = `Error: ${err instanceof Error ? err.message : String(err)}`;
      // Fallback: try the asset endpoint directly
      this._imageUrl = "./api/game-asset?file=openclaw_for_game_architecture.png";
    }
  }

  private async _handleSend() {
    const text = this._inputValue.trim();
    if (!text) return;

    try {
      const res = await fetch("./api/game-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        this._feedback = `Sent: "${text}"`;
        this._inputValue = "";
      } else {
        this._feedback = `Error: ${res.status} ${res.statusText}`;
      }
    } catch (err) {
      this._feedback = `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      this._handleSend();
    }
  }

  private _handleInput(e: Event) {
    this._inputValue = (e.target as HTMLInputElement).value;
  }

  override render() {
    return html`
      <div class="container">
        <header>
          <h1>Game Control Big Screen</h1>
          <div class="status-badge">
            <span class="status-dot"></span>
            Gateway Connected
          </div>
          <span class="ws-status ${this._wsStatus}">
            WS: ${this._wsStatus}
          </span>
        </header>

        <div class="hello-world">
          <h2>Hello, Director!</h2>
          <p>
            Welcome to the Game Control Big Screen. This is your command center
            for managing players, missions, and storyline events through the
            OpenClaw Gateway.
          </p>
        </div>

        <div class="fetch-box">
          <h2>3DGS Asset Hook Test</h2>
          <button
            class="fetch-btn"
            @click=${this._handleFetch3DGS}
          >
            Fetch 3DGS Scene
          </button>
          ${this._hookResponse
            ? html`<div class="hook-response">${this._hookResponse}</div>`
            : ""}
          ${this._imageUrl
            ? html`
                <div class="image-container">
                  <img src=${this._imageUrl} alt="3DGS Scene Asset" />
                </div>
              `
            : ""}
        </div>

        <div class="message-box">
          <h2>Send Message to Server</h2>
          <div class="message-form">
            <input
              class="message-input"
              type="text"
              placeholder="Type something to send to the server log..."
              .value=${this._inputValue}
              @input=${this._handleInput}
              @keydown=${this._handleKeydown}
            />
            <button class="send-btn" @click=${this._handleSend}>Send</button>
          </div>
          <div class="feedback ${this._feedback.startsWith("Error") ? "error" : ""}">
            ${this._feedback}
          </div>
        </div>

        <div class="grid">
          <div class="panel">
            <h2>Player Chat</h2>
            <p>Real-time messages from connected players will appear here via Matrix channel.</p>
          </div>
          <div class="panel">
            <h2>Mission Control</h2>
            <p>Create and assign missions to players. Track completion status in real-time.</p>
          </div>
          <div class="panel">
            <h2>Storyline Events</h2>
            <p>Trigger narrative events and control the game storyline progression.</p>
          </div>
          <div class="panel">
            <h2>Game State</h2>
            <p>Monitor overall game state, active sessions, and system health.</p>
          </div>
        </div>
      </div>
    `;
  }
}

export { GameControlApp };
