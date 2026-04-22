# CollabEdit - Real-time Collaborative Photo Editor

CollabEdit is a high-performance, real-time collaborative image editor built with **React**, **Fabric.js**, **Express**, and **Socket.io**. It allows multiple users to work on the same canvas simultaneously, perfect for quick design brainstorming or live photo annotation.

## 🚀 Key Features

- **Real-time Sync**: Every object added, moved, or styled is broadcasted to all users in the same room using WebSockets.
- **Dynamic Rooms**: Join or create rooms instantly via URL parameters (e.g., `?room=design-101`).
- **Pencil & Select Tools**: Switch between freehand drawing and object selection.
- **Rich Shape Engine**: Add Rectangles, Circles, and interactive Text with one click.
- **Image Support**: Upload your own photos directly onto the canvas.
- **Layer Management**: Bring objects to front or send them to back.
- **Color Palette**: Live styling for selected objects or the drawing brush.
- **Export**: Save your collaborative masterpiece as a PNG file instantly.
- **Mobile Responsive**: The canvas auto-scales to fit your screen while maintaining aspect ratio and coordinate precision.
- **User Presence**: Real-time tracking of active collaborators in each room.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS 4.
- **Animations**: Motion (by Framer).
- **Icons**: Lucide React.
- **Canvas Engine**: Fabric.js (Canvas API wrapper).
- **Messaging**: Socket.io for bi-directional live communication.
- **Server**: Express (Node.js) serving both Vite and the Socket server.

## 📦 How to Use

1. **Join a Room**: Enter a room ID or share your current URL with a friend.
2. **Add Content**: Use the toolbar to add shapes, text, or images.
3. **Draw**: Click the Pencil icon to toggle freehand drawing mode.
4. **Style**: Select an object and click a color in the palette to update it.
5. **Manage Layers**: Use the up/down chevrons to move objects between layers.
6. **Export**: Click the download icon to save the final result.

---

