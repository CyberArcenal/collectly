// src/utils/websocketClient.js
const { logger } = require("./logger");
const TokenStorage = require("./tokenStorage");
const { BrowserWindow } = require("electron");

class WebSocketClient {
  constructor(options = {}) {
    this.url = null;
    this.ws = null;
    this.isConnected = false;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectDelay = options.reconnectDelay || 1000; // initial delay
    this.maxReconnectDelay = options.maxReconnectDelay || 30000;
    this.listeners = new Map();
    this.pendingMessages = [];
    this.authToken = null;
    this.connectionPromise = null;
  }

  /**
   * Connect to the WebSocket server
   * @param {string} url - WebSocket URL (e.g., ws://localhost:8000/ws/sync/)
   * @param {string} token - Optional initial token
   * @returns {Promise<void>}
   */
  connect(url, token = null) {
    if (this.ws && this.isConnected) {
      logger.warn(
        "[WebSocketClient] Already connected, ignoring connect request",
      );
      return Promise.resolve();
    }

    this.url = url;
    this.authToken = token || this._getToken();

    return new Promise((resolve, reject) => {
      this.connectionPromise = { resolve, reject };
      this._connect();
    });
  }

  _connect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.shouldReconnect = true;
        logger.info(`[WebSocketClient] Connected to ${this.url}`);

        // Send authentication
        const token = this.authToken || this._getToken();
        if (token) {
          this.send({ type: "auth", token });
        } else {
          logger.warn("[WebSocketClient] No token available for auth");
        }

        // Resolve the connection promise
        if (this.connectionPromise) {
          this.connectionPromise.resolve();
          this.connectionPromise = null;
        }

        // Emit 'open' event
        this._emit("open");

        // Send any pending messages
        while (this.pendingMessages.length > 0) {
          const msg = this.pendingMessages.shift();
          this.send(msg);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleMessage(data);
        } catch (err) {
          logger.error("[WebSocketClient] Failed to parse message:", err);
          // Still emit as raw if needed
          this._emit("message", event.data);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        logger.warn(
          `[WebSocketClient] Connection closed (code: ${event.code}, reason: ${event.reason || "none"})`,
        );
        this._emit("close", { code: event.code, reason: event.reason });

        // Attempt reconnect if not intentionally closed
        if (
          this.shouldReconnect &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this._scheduleReconnect();
        } else if (this.connectionPromise) {
          this.connectionPromise.reject(new Error("Connection failed"));
          this.connectionPromise = null;
        }
      };

      this.ws.onerror = (error) => {
        logger.error("[WebSocketClient] WebSocket error:", error);
        this._emit("error", error);
        // The onclose will follow
      };
    } catch (err) {
      logger.error("[WebSocketClient] Failed to create WebSocket:", err);
      if (this.connectionPromise) {
        this.connectionPromise.reject(err);
        this.connectionPromise = null;
      }
      throw err;
    }
  }

  _scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay,
    );
    logger.info(
      `[WebSocketClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
    );
    setTimeout(() => {
      if (this.shouldReconnect) {
        this._connect();
      }
    }, delay);
  }

  /**
   * Send a message to the server
   * @param {object|string} data - Message to send (will be JSON.stringified if object)
   */
  send(data) {
    const message = typeof data === "string" ? data : JSON.stringify(data);
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Queue for later
      this.pendingMessages.push(data);
      logger.debug("[WebSocketClient] Message queued (not connected)");
    }
  }

  /**
   * Handle incoming message
   */
  _handleMessage(data) {
    // Emit 'message' event with raw data
    this._emit("message", data);

    // Emit custom event based on message type
    if (data.type) {
      this._emit(`message:${data.type}`, data);
    }

    // Handle specific types (e.g., auth success, progress)
    if (data.type === "auth_success") {
      logger.info("[WebSocketClient] Authentication successful");
    } else if (data.type === "auth_failed") {
      logger.error("[WebSocketClient] Authentication failed:", data.message);
      // Maybe trigger token refresh
      if (data.code === "token_expired") {
        this._refreshTokenAndReconnect();
      }
    } else if (data.type === "progress") {
      // Progress updates are handled by the sync service
      this._emit("progress", data);
    } else if (data.type === "task_status") {
      this._emit("task_status", data);
    } else if (data.type === "task_completed") {
      this._emit("task_completed", data);
    } else if (data.type === "task_failed") {
      this._emit("task_failed", data);
    } else if (data.type === "error") {
      this._emit("error", data);
    } else if (data.type === "task_cancelled") {
      this._emit("task_cancelled", data);
    }
  }

  /**
   * Get token from storage
   */
  _getToken() {
    try {
      return TokenStorage.getAccessToken();
    } catch (err) {
      logger.error("[WebSocketClient] Failed to get token:", err);
      return null;
    }
  }

  /**
   * Refresh token and reconnect
   */
  async _refreshTokenAndReconnect() {
    try {
      const onlineClient = require("./onlineClient");
      const newToken = await onlineClient.refreshToken();
      this.authToken = newToken;
      logger.info("[WebSocketClient] Token refreshed, reconnecting...");
      this.disconnect(false);
      this._connect();
    } catch (err) {
      logger.error("[WebSocketClient] Failed to refresh token:", err);
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send("auth:unauthorized");
      });
      this.disconnect(true);
    }
  }

  /**
   * Disconnect from the server
   * @param {boolean} permanent - If true, prevents automatic reconnection
   */
  disconnect(permanent = false) {
    this.shouldReconnect = !permanent;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.pendingMessages = [];
    if (permanent) {
      this.reconnectAttempts = this.maxReconnectAttempts; // prevent further reconnects
      this.connectionPromise = null;
    }
  }

  /**
   * Register event listener
   * @param {string} event - Event name (open, close, error, message, progress, task_status, etc.)
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const list = this.listeners.get(event);
      const index = list.indexOf(callback);
      if (index !== -1) {
        list.splice(index, 1);
      }
    }
  }

  /**
   * Internal: emit event to listeners
   */
  _emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          logger.error(
            `[WebSocketClient] Error in listener for ${event}:`,
            err,
          );
        }
      }
    }
  }

  /**
   * Check if connected
   */
  get connected() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

module.exports = WebSocketClient;
