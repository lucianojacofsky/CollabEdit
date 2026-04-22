import React, { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import { motion } from 'motion/react';
import { Share2, Users, Layers, Image as ImageIcon, Copy } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const existingRoom = params.get('room');
    if (existingRoom) return existingRoom;
    
    // Generate a short random ID if none exists
    return uuidv4().split('-')[0];
  });
  const [isJoined, setIsJoined] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get('room');
  });
  const [memberCount, setMemberCount] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (isJoined) {
      params.set('room', roomId);
    } else {
      params.delete('room');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [roomId, isJoined]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      setIsJoined(true);
      toast.success(`Joined room: ${roomId}`);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Room link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      toast.success('Room ID copied!');
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#141414] font-sans">
      <Toaster position="top-center" />
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] rounded-full flex items-center justify-center text-white">
            <ImageIcon size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight italic font-serif">CollabEdit</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wider">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Session
          </div>
          {isJoined && (
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 border border-[#141414] rounded-full hover:bg-[#141414] hover:text-white transition-all duration-300 text-sm font-medium"
            >
              <Share2 size={16} />
              Share
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {!isJoined ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-20 bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Collaborate in Real-time</h2>
              <p className="text-gray-500">Enter a room ID to start editing with others.</p>
            </div>
            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">Room ID</label>
                  <button 
                    type="button"
                    onClick={() => setRoomId(uuidv4().split('-')[0])}
                    className="text-[10px] font-bold text-blue-500 hover:underline uppercase tracking-tighter"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g. design-team-1"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-gray-200"
              >
                Join Room
              </button>
            </form>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full overflow-hidden"
            >
              <Canvas roomId={roomId} onMemberCountChange={setMemberCount} />
              <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <p>Room: <span className="font-mono text-[#141414] font-bold">{roomId}</span></p>
                  <button 
                    onClick={copyRoomId}
                    className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-500"
                    title="Copy Room ID"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p>800 x 600 px (Canvas Native)</p>
              </div>
            </motion.div>

            <motion.aside 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg space-y-8 lg:sticky lg:top-8"
            >
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <Layers size={14} />
                  Workspace Info
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-sm font-medium text-gray-600 mb-2">Active Users</p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(memberCount, 4) }).map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                            User
                          </div>
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-400">
                        {memberCount} online
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-xs text-gray-400 italic">Syncing across {roomId}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setIsJoined(false)}
                  className="w-full py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Leave Session
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </main>
      
      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#141414] text-white rounded-full shadow-2xl flex items-center gap-6 text-xs font-medium tracking-wide">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Connected to Server
        </div>
        <div className="w-px h-4 bg-white/20"></div>
        <p>© 2026 CollabEdit Studio</p>
      </footer>
    </div>
  );
}
