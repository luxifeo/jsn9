$(document).ready(function() {
  const socket = io();
  const myName = $("#my-name").text();
  let room;
  let msgInputForm = $('#chat-input input')
  $("#room-input").submit(function() {
    room = $("#room-input input").val();
    $("#room-input input").val("");
    if ($.trim(room) === "") {
      alert("Please type a room");
    } else {
      socket.emit("join", room);
      $("#notification").html("Connecting to room " + room);
    }
    return false;
  });
  $("#chat-input").submit(function() {
    let message = $("#chat-input input").val();
    $("#chat-input input").val("");
    if (room) {
      console.log(message);
      let time = new Date();
      socket.emit("chat message", { content: message, time: time });
      $("#messages").append($("<li class='me'>").html(message));
    } else alert("You must join a room");
    return false; // prevent default refresh
  });
  socket.on("errorMsg", message => {
    alert(message);
  });
  socket.on("chat message", message => {
    console.log(message);
    $("#messages").append(
      $("<li class='other'>").html(
        "<b>" + message.name + "</b> : " + message.content
      )
    );
  });
  msgInputForm.on('input', function() {
    let status; // 0 == empty, 1== typing
    if(msgInputForm.val() != '') {
      status = 1;
    } else status = 0;
    socket.emit('user typing', {username: myName, status})
  })
  // this event is emitted after successfully connecting
  // TODO: Display rooms info on the web, attach click event on rooms name so that user can click to join room
  socket.on('rooms info', room => console.log(room))
  // this event is called on successfully joining chat room
  // TODO: Display user in room 
  socket.on("users in room", clients => {
    console.log('User in room')
    console.log(clients);
  });
  socket.on("new user", user => {
    console.log('User joins the fun ' + user)
  })
  // should i name this event 'chat log' :))
  socket.on("chat log", doc => {
    $("#notification").html("Successfully join room " + room);
    for (let i = doc.length - 1; i >= 0; i--) {
      if (doc[i].username == myName) {
        $("#messages").append($("<li class='me'>").html(doc[i].message));
      } else {
        $("#messages").append(
          $("<li class='other'>").html(
            "<b>" + doc[i].username + "</b> : " + doc[i].message
          )
        );
      }
    }
    // console.log(doc);
  });
});
