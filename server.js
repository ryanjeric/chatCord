const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {getCurrentUser,userJoin, userLeave,getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
// Set status folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = "CHATBOT";

// RUN WHEN CLIENT connects
io.on('connection', socket => {
    console.log("new WS connection...");

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id,username,room);
        socket.join(user.room);

        // Welcome the current user
        socket.emit('message', formatMessage(botName, 'Welcome to Chat!')); // single client 
        //Broadcast when a user connects
        //socket.broadcast.emit('message', formatMessage(botName, 'A user has joined the chat')); // all client except the client connecting
        socket.broadcast
        .to(user.room)
        .emit(
            'message',
            formatMessage(botName, `${user.username} has joined the chat`)); // all client except the client connecting
        //io.emit // all client on general

        // Send Users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        });


    })

    //listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })
    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit(
                'message', 
                formatMessage(botName, `${user.username} has left the chat`
            ));
            io.to(user.room).emit('roomUsers',{
                room:user.room,
                users:getRoomUsers(user.room)
            });
        }

        
    })
})
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));