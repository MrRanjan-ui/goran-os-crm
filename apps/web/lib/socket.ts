import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://localhost:5001", {
      withCredentials: true
    });
  }
  return socket;
}
