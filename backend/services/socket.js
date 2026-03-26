const socketIo = require('socket.io');

let io;

module.exports = {
    init: (server) => {
        io = socketIo(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        io.on('connection', (socket) => {
            console.log(`[Socket.io] Client connected: ${socket.id}`);
            socket.on('disconnect', () => {
                console.log(`[Socket.io] Client disconnected: ${socket.id}`);
            });
        });

        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};
