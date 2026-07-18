# Secios

A lightweight Server-Sent Events (SSE) client for Node.js, powered by [Axios](https://axios-http.com/) and [eventsource-parser](https://github.com/rexxars/eventsource-parser).

Secios lets you consume SSE streams using the Axios instance you already have — complete with your base URLs, headers, interceptors, and auth. No separate HTTP client needed.

## Features

- **Axios-native** - reuse your existing Axios instance with all its configuration
- **Typed events** - full TypeScript support out of the box
- **Simple event API** - `on`, `once`, `off` with unsubscribe functions
- **Cancellable** - close connections cleanly at any time
- **Tiny** - only one runtime dependency (`eventsource-parser`)

## Install

```bash
# npm
npm install secios

# pnpm
pnpm add secios

# yarn
yarn add secios
```

Axios is a peer dependency - make sure it's installed in your project:

```bash
npm install axios
```

## Quick Start

```ts
import axios from "axios";
import { secios } from "secios";

// Create an Axios instance with your config
const api = axios.create({
  baseURL: "https://example.com/api",
  headers: { Authorization: "Bearer ey..." },
});

// Connect to an SSE endpoint
const conn = await secios.create(api).connect("/messages/sse");

// Listen for events
conn.on("message", (event) => {
  console.log(event.data);
});
```

## API

### `secios`

A default `SeciosInstance` - ready to use without any setup.

```ts
import { secios } from "secios";

// Uses a default Axios instance
const conn = await secios.connect("/events");
```

### `secios.create(axiosInstance)`

Creates a new `SeciosInstance` bound to a specific Axios instance.

```ts
const instance = secios.create(myAxios);
const conn = await instance.connect("/stream");
```

### `instance.connect(url): Promise<SeciosConnection>`

Opens an SSE connection to the given URL. The URL is resolved against the Axios instance's `baseURL`.

Returns a `SeciosConnection` once the stream is established.

### `SeciosConnection`

#### `conn.on(event, callback): () => void`

Subscribe to a named event. Returns an unsubscribe function.

```ts
const off = conn.on("message", (event) => {
  console.log(event.id, event.event, event.data);
});

// Later - unsubscribe:
off();
```

#### `conn.once(event, callback): () => void`

Subscribe to the next occurrence of an event only. The listener is automatically removed after it fires. Returns an unsubscribe function for early removal.

```ts
conn.once("message", (event) => {
  console.log("First event:", event.data);
});
```

#### `conn.off(event, callback): void`

Remove a specific listener by reference.

```ts
const handler = (event: SeciosEvent) => console.log(event);
conn.on("message", handler);
conn.off("message", handler);
```

#### `conn.close(): void`

Closes the connection by cancelling the underlying Axios request.

```ts
conn.close();
```

### `SeciosEvent`

The event object passed to all listeners:

```ts
interface SeciosEvent {
  id: string; // Event ID (empty string if not provided by server)
  event: string; // Event type (empty string if not provided by server)
  data: string; // Event payload
}
```

## License

[MIT](LICENSE) © 2026 Martin Petr
