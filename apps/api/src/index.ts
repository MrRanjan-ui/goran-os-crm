import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true
  }
});

io.on("connection", (socket) => {
  socket.emit("connected", { message: "GoRan OS realtime connected" });
});

app.set("io", io);

try {
  await connectDatabase();
  console.log("Database connected successfully");
} catch (error) {
  console.error("Database connection failed:", error);
}

server.listen(env.PORT, () => {
  console.log(`GoRan OS API listening on :${env.PORT}`);
});
