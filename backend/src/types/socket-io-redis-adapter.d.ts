declare module '@socket.io/redis-adapter' {
  import { Adapter } from 'socket.io';

  export function createAdapter(
    pubClient: any,
    subClient: any,
    options?: any
  ): Adapter;
}
