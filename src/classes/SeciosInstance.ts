import type { AxiosInstance } from "axios";
import axios from "axios";
import { SeciosConnection } from "./SeciosConnection.js";

export class SeciosInstance {
  private readonly _axios: AxiosInstance;

  constructor(axiosInstance?: AxiosInstance) {
    this._axios = axiosInstance ?? axios.create();
  }

  public async connect(url: string): Promise<SeciosConnection> {
    return await new SeciosConnection().connect(this._axios, url);
  }

  public create(axiosInstance: AxiosInstance): SeciosInstance {
    return new SeciosInstance(axiosInstance);
  }
}
