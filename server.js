require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const http = require('http').Server(app)
const session = require('express-session')
const mongoose = require('mongoose')
const io = require('socket.io')(http)
const passportSocketIo = require('passport.socketio')
const cookieParser = require('cookie-parser')
const sessionStore = new session.MemoryStore()
const auth = require('./app/auth')
const Message = require('./model/message')
const routes = require('./app/routes')

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection
app.use(session({
    secret: process.env.SECRET,
    key: 'express.sid',
    resave: true,
    saveUninitialized: true,
    store: sessionStore
}))
db.on('error', function (error) {
    app.get("/*", function (request, response) {
        response.sendStatus(503);
    });
})
db.once('open', function () {
    auth(app)
    routes(app)
    io.use(passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: 'express.sid',
        secret: process.env.SECRET,
        store: sessionStore
    }))
    io.on('connection', socket => {
        // console.log(socket.request)
        const username = socket.request.user.username
        console.log('A user connected: ' + username)

        socket.on('disconnect', function() {
            console.log('User ' + username + ' disconnected')
        })
        socket.on('chat message', function(message) {
            if(socket.request.user.room) {
                let msg = new Message({
                    room: socket.request.user.room,
                    time: message.time,
                    username,
                    message: message.content
                })
                msg.save(function(err, result) {
                    if(err)
                        throw err
                    socket.to(socket.request.user.room).broadcast.emit('chat message', {content: message.content, name: username, time: message.time})
                })
            } else {
                console.log('err')
                socket.emit('error', 'You don\t join any room yet')
            }
        })
        // Room chat
        socket.on('join', function(room) {
            io.in(room).clients(function(err, clients) {
                if(err) {
                    throw err;
                }
                socket.request.user.room = room
                socket.join(room)
                console.log('user join room ' + room)
            })
        })
        
    })

})
http.listen(3000, () => console.log('listening on port 3000'))