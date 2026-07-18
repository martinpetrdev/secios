import type { AxiosInstance, CancelTokenSource } from "axios";
import { createParser } from "eventsource-parser";
import { SeciosEventEmitter } from "./SeciosEventEmitter";
import type { SeciosEvent } from "../types";
import axios from "axios";

export class SeciosConnection extends SeciosEventEmitter {
  private _cancelToken: CancelTokenSource | null = null;

  public async connect(
    axiosInstance: AxiosInstance,
    url: string,
  ): Promise<this> {
    const cancelToken = axios.CancelToken.source();
    this._cancelToken = cancelToken;

    const { data: stream } = await axiosInstance.get(url, {
      headers: {
        Accept: "text/event-stream",
      },
      responseType: "stream",
      cancelToken: cancelToken.token,
    });

    const parser = createParser({
      onEvent: (event) => {
        this.emit(event.event ?? "event", {
          id: event.id ?? "",
          event: event.event ?? "",
          data: event.data ?? "",
        });
      },
    });

    stream.on("data", (chunk: Buffer) => {
      parser.feed(chunk.toString());
    });

    return this;
  }

  public close(): void {
    if (this._cancelToken)
      this._cancelToken.cancel("Connection closed by user.");
  }

  protected override emit(event: string, data: SeciosEvent) {
    super.emit(event, data);
  }
}
