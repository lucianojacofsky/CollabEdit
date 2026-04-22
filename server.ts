import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      // Update room count
      const clients = io.sockets.adapter.rooms.get(roomId);
      io.to(roomId).emit("room-info", {
        memberCount: clients ? clients.size : 0
      });
    });

    // Broadcast canvas changes
    socket.on("canvas-change", (data) => {
      // data: { roomId, action, objectData }
      socket.to(data.roomId).emit("canvas-change", data);
    });

    socket.on("disconnecting", () => {
      socket.rooms.forEach(roomId => {
        const clients = io.sockets.adapter.rooms.get(roomId);
        // Size will include current socket until fully disconnected, 
        // so we manually adjust or wait. Better to broadcast to others in room.
        socket.to(roomId).emit("room-info", {
          memberCount: (clients ? clients.size : 1) - 1
        });
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
