import { io } from "socket.io-client";
import { api } from "./api";

export const socket = io(api.defaults.baseURL ?? "http://localhost:4000", {
  autoConnect: false
});
