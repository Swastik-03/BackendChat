const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: '*'
}));
app.use(express.json()); // Middleware to parse JSON bodies

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*'
    }
});

const users = {}; // To store user connections

io.on('connection', (socket) => {
    console.log("New user connected -->", socket.id);

    // When a user disconnects
    socket.on('disconnect', () => {
        console.log("User Disconnected -->", socket.id);
        // Optionally: Remove user from all rooms here if necessary
    });

    // Handle incoming group messages
    socket.on('message', (data) => {
        const message = {
            senderId: socket.id,
            content: data.content,
            room: data.room // Assuming you include the room in the message data
        };
        // Emit to all clients in the specific room
        io.to(data.room).emit('message', message); // Emit to the specified room
    });
});

// API endpoint to join a room
app.post('/joinRoom', (req, res) => {
    const { roomId } = req.body;

    // Get the socket ID from the request body instead of req.socket
    const socketId = req.body.socketId;

    if (roomId && socketId) {
        const socket = io.sockets.sockets.get(socketId); // Get the socket instance
        if (socket) {
            socket.join(roomId); // Join the specified room
            console.log(`User ${socketId} joined room: ${roomId}`);
            return res.status(200).json({ message: `Joined room: ${roomId}` });
        }
    }

    return res.status(400).json({ message: 'Invalid room ID or socket ID' });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
    console.log("Server running on port: ", port);
});
