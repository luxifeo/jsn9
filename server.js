require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const http = require("http").Server(app);
const session = require("express-session");
const mongoose = require("mongoose");
const io = require("socket.io")(http);
const passportSocketIo = require("passport.socketio");
const cookieParser = require("cookie-parser");
// const sessionStore = new session.MemoryStore()
const auth = require("./app/auth");
const Message = require("./model/message");
const routes = require("./app/routes");
const mongostore = require("connect-mongo")(session);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
const sessionStore = new mongostore({ mongooseConnection: db });
app.use(
  session({
    secret: process.env.SECRET,
    key: "express.sid",
    resave: true,
    saveUninitialized: true,
    // store: sessionStore
    store: sessionStore
  })
);
db.on("error", function(error) {
  app.get("/*", function(request, response) {
    response.sendStatus(503);
  });
});
db.once("open", function() {
  let roomCount = {};
  auth(app);
  routes(app);
  io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: "express.sid",
      secret: process.env.SECRET,
      store: sessionStore
    })
  );
  io.on("connection", socket => {
    // console.log(socket.request)
    const username = socket.request.user.username;
    // console.log(roomCount)
    console.log("A user connected: " + username);
    socket.emit("rooms info", roomCount);
    socket.on("disconnect", function() {
      console.log("User " + username + " disconnected");
      let room = socket.request.user.room;
      if (room) {
        console.log("Room " + room + " -1 person");
        console.log(username)
        // removeItem(roomCount[room], username);
        // if (roomCount[room].length == 0) delete roomCount[room];
        leaveRoom(room, username)
        console.log(roomCount)
        // TODO: Emit event to room that user disconnected
        // io.emit('user', {room: roomCount[room], username})
        io.to(room).emit("user", { username, join: false });
      }
    });
    socket.on("chat message", function(message) {
      if (socket.request.user.room) {
        let msg = new Message({
          room: socket.request.user.room,
          time: message.time,
          username,
          message: message.content
        });
        msg.save(function(err, result) {
          if (err) throw err;
          socket 
            .to(socket.request.user.room)
            .broadcast.emit("chat message", {
              content: message.content,
              name: username,
              time: message.time
            });
        });
      } else {
        console.log("err");
        socket.emit("errorMsg", "You don\t join any room yet");
      }
    });
    // Typing event, object emitted {username, status: 1=typing,0=not typing}
    // socket.on("user typing", function(userAndStatus) {
    //   if (socket.request.user.room) {
    //     socket
    //       .to(socket.request.user.room)
    //       .broadcast.emit("user typing", userAndStatus);
    //   }
    // });
    // Room chat
    socket.on("get rooms info", function() {
      socket.emit("rooms info", roomCount);
    });
    socket.on("join", function(room) {
      io.in(room).clients(function(err, clients) {
        if (err) {
          throw err;
        }
        let previousRoom = socket.request.user.room;
        if (socket.request.user.room) {
          socket.leave(previousRoom);
          // TODO: Emit leave event to previousRoom, delete user from roomCount
          io.in(previousRoom).emit("user", { username, join: false });
          leaveRoom(previousRoom, username)
        }
        socket.request.user.room = room;
        socket.join(room);
        roomCount[room] = roomCount[room] || [];
        roomCount[room].push(username);
        // New user event
        socket.to(room).broadcast.emit("user", { username, join: true });
        socket.emit("users in room", clients.length);
        // Tìm 10 message gần đây nhất của room này, emit lại cho client
        Message.find(
          { room: room },
          null,
          { sort: { time: -1 }, limit: 10 },
          (err, doc) => {
            if (err) throw err;
            socket.emit("join success", doc);
          }
        );
        console.log("user join room " + room);
      });
    });
    function leaveRoom(room, username) {
      /*
      * Remove user from room and delete room info if room is empty
      */
      removeItem(roomCount[room], username);
      if (roomCount[room].length == 0) delete roomCount[room];
    }
  });
});
http.listen(3000, () => console.log("listening on port 3000"));
function removeItem(arr, item) {
  let length = arr.length;
  let ind = arr.indexOf(item);
  if (ind == -1 || ind == length - 1) {
    return;
  } else {
    let temp = arr[ind];
    arr[ind] = arr[length - 1];
    arr[length - 1] = temp;
    return arr.pop();
  }
}
