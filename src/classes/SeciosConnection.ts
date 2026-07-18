import type { AxiosInstance } from "axios";
import { createParser } from "eventsource-parser";
import { SeciosEventEmitter } from "./SeciosEventEmitter";
import type { SeciosEvent } from "../types";

export class SeciosConnection extends SeciosEventEmitter {
  private _abortController: AbortController | null = null;

  public async connect(
    axiosInstance: AxiosInstance,
    url: string,
  ): Promise<this> {
    const abortController = new AbortController();
    this._abortController = abortController;

    let offset = 0;

    const parser = createParser({
      onEvent: (event) => {
        this.emit(event.event ?? "event", {
          id: event.id ?? "",
          event: event.event ?? "",
          data: event.data ?? "",
        });
      },
    });

    await axiosInstance.get(url, {
      headers: {
        Accept: "text/event-stream",
      },
      responseType: "text",
      adapter: "xhr",
      signal: abortController.signal,
      onDownloadProgress: ({ event }) => {
        const xhr = event.target as XMLHttpRequest;
        const newText = xhr.responseText.substring(offset);
        
        offset = xhr.responseText.length;
        parser.feed(newText);
      },
    });

    return this;
  }

  public close(): void {
    if (this._abortController) this._abortController.abort();
  }

  protected override emit(event: string, data: SeciosEvent) {
    super.emit(event, data);
  }
}
