const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

const app=express();

app.use(cors({
    origin: '*'
}));

const server= http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: '*'
    }
});

const users={}

io.on('connection', (socket)=>{
    console.log("New user connected -->",socket.id);
    users[socket.id]=socket;
    
    socket.on('message',(data)=>{
        const message={
            senderId: socket.id,
            content: data.content
        }
        io.emit('message',message);
    });
    socket.on('privateMessage',(data)=>{
        const { recieverID , content , senderId}=data;
        const recieverSocket = user[recieverID];
        if(recieverID){
            const result = {
                senderId: senderId,
                content: content
            }
            recieverSocket.emit('privateMessage',result);
        }
        else{
            console.log("user offline");
        }
    });
    socket.on('disconnect',()=>{
        console.log("User Disconnected");
        delete users[socket.id]
    })
});

const port = process.env.PORT || 4000;
server.listen(port,()=>{
  console.log("Server running of port: ",port);  
})