import type { SeciosEvent } from "../types";

export class SeciosEventEmitter {
  private readonly _listeners: Map<
    string,
    Set<{ callback: (event: SeciosEvent) => void; once: boolean }>
  > = new Map();

  protected emit(event: string, data: SeciosEvent): void {
    if (!this._listeners.has(event)) return;

    const listeners = this._listeners.get(event)!;
    for (const listener of listeners) {
      listener.callback(data);

      if (listener.once) listeners.delete(listener);
    }
  }

  public on(event: string, callback: (event: SeciosEvent) => void): () => void {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());

    const listener = { callback, once: false };
    this._listeners.get(event)!.add(listener);

    return () => {
      this._listeners.get(event)!.delete(listener);
    };
  }

  public once(
    event: string,
    callback: (event: SeciosEvent) => void,
  ): () => void {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());

    const listener = { callback, once: true };
    this._listeners.get(event)!.add(listener);

    return () => {
      this._listeners.get(event)!.delete(listener);
    };
  }

  public off(event: string, callback: (event: SeciosEvent) => void): void {
    if (!this._listeners.has(event)) return;

    const listeners = this._listeners.get(event)!;
    for (const listener of listeners) {
      if (listener.callback === callback) {
        listeners.delete(listener);
        break;
      }
    }
  }
}
