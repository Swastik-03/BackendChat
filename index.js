const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: '*' // Allow all origins for CORS
}));
app.use(express.json()); // Middleware to parse JSON bodies

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*'
    }
});

const users = {}; // To store user connections and their usernames

io.on('connection', (socket) => {
    console.log("New user connected -->", socket.id);

    // When a user disconnects
    socket.on('disconnect', () => {
        console.log("User Disconnected -->", socket.id);
        // Optionally: Remove user from all rooms here if necessary
        delete users[socket.id]; // Remove the user from the users object
    });

    // Handle incoming group messages
    socket.on('message', (data) => {
        const message = {
            senderId: socket.id,
            senderName: data.senderName, // Include sender name
            content: data.content,
            room: data.room // Room the message is sent to
        };
        // Emit to all clients in the specific room
        io.to(data.room).emit('message', message); // Emit to the specified room
    });

    // Join room handler
    socket.on('joinRoom', (data) => {
        const { roomId, username } = data;

        if (roomId && username) {
            socket.join(roomId); // Join the specified room
            users[socket.id] = username; // Store the username
            console.log(`User ${username} (${socket.id}) joined room: ${roomId}`);
            // Optionally notify other users in the room
            socket.to(roomId).emit('message', {
                senderId: 'System',
                senderName: 'System',
                content: `${username} has joined the room.`,
                room: roomId
            });
        }
    });
});

// API endpoint to join a room
app.post('/joinRoom', (req, res) => {
    const { roomId, socketId, username } = req.body;

    if (roomId && socketId && username) {
        const socket = io.sockets.sockets.get(socketId); // Get the socket instance
        if (socket) {
            socket.join(roomId); // Join the specified room
            users[socketId] = username; // Store the username
            console.log(`User ${username} (${socketId}) joined room: ${roomId}`);
            return res.status(200).json({ message: `Joined room: ${roomId}` });
        }
    }

    return res.status(400).json({ message: 'Invalid room ID, socket ID, or username' });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
    console.log("Server running on port: ", port);
});
