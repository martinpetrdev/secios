import type { AxiosInstance } from "axios";
import { createParser } from "eventsource-parser";
import { SeciosEventEmitter } from "./SeciosEventEmitter.js";
import type { SeciosEvent } from "../types.js";

export class SeciosConnection extends SeciosEventEmitter {
  private _abortController: AbortController | null = null;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _closed = false;
  private _retry = 3000;
  private _lastEventId = "";
  private _axios!: AxiosInstance;
  private _url!: string;
  private readonly _errorListeners = new Set<(error: unknown) => void>();

  public async connect(
    axiosInstance: AxiosInstance,
    url: string,
  ): Promise<this> {
    this._axios = axiosInstance;
    this._url = url;
    this._closed = false;
    await this._open(true);
    return this;
  }

  public close(): void {
    this._closed = true;
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    if (this._abortController) this._abortController.abort();
  }

  public onError(callback: (error: unknown) => void): () => void {
    this._errorListeners.add(callback);
    return () => {
      this._errorListeners.delete(callback);
    };
  }

  private async _open(initial = false): Promise<void> {
    const abortController = new AbortController();
    this._abortController = abortController;

    const headers: Record<string, string> = { Accept: "text/event-stream" };
    if (this._lastEventId) headers["Last-Event-ID"] = this._lastEventId;

    const parser = createParser({
      onEvent: (event) => {
        if (event.id !== undefined) this._lastEventId = event.id;
        this.emit(event.event ?? "event", {
          id: event.id ?? "",
          event: event.event ?? "",
          data: event.data ?? "",
        });
      },
      onRetry: (retry) => {
        this._retry = retry;
      },
    });

    // Called once per attempt when the stream ends or fails; schedules a reconnect.
    let ended = false;
    const end = (error?: unknown) => {
      if (ended || this._closed) return;
      ended = true;

      if (error !== undefined) {
        for (const listener of this._errorListeners) listener(error);
      }

      // Like EventSource: client errors (auth, not found, ...) are permanent.
      const status = (error as any)?.response?.status;
      if (status >= 400 && status < 500) return;

      this._reconnectTimer = setTimeout(() => void this._open(), this._retry);
    };

    const isNode = !!(globalThis as any).process?.versions?.node;

    if (!isNode) {
      let offset = 0;

      // Fire-and-forget: XHR won't resolve until the response ends
      this._axios
        .get(this._url, {
          headers,
          responseType: "text",
          adapter: "xhr",
          signal: abortController.signal,
          onDownloadProgress: ({ event }) => {
            const xhr = event.target as XMLHttpRequest;
            const newText = xhr.responseText.substring(offset);

            offset = xhr.responseText.length;
            parser.feed(newText);
          },
        })
        .then(() => end(), end);
    } else {
      try {
        const { data: stream } = await this._axios.get(this._url, {
          headers,
          responseType: "stream",
          signal: abortController.signal,
        });

        stream.on("data", (chunk: any) => {
          parser.feed(String(chunk));
        });
        stream.on("end", () => end());
        stream.on("error", end);
      } catch (error) {
        // The first connect() rejects instead, so the caller sees the failure.
        if (initial) throw error;
        end(error);
      }
    }
  }

  protected override emit(event: string, data: SeciosEvent) {
    super.emit(event, data);
  }
}
