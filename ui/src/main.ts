import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("game-control-app")
class GameControlApp extends LitElement {
  @state() private _feedback = "";
  @state() private _inputValue = "";

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
  `;

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
        </header>

        <div class="hello-world">
          <h2>Hello, Director!</h2>
          <p>
            Welcome to the Game Control Big Screen. This is your command center
            for managing players, missions, and storyline events through the
            OpenClaw Gateway.
          </p>
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
