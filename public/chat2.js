$(document).ready(function() {
  const socket = io();
  const myName = $("#myName").text();
  let myRoom;
  // hiện phòng đang có người
  socket.on("rooms info", function(roomList) {
    if(!myRoom) {
    for (let x in roomList) {
      $(".messages").append(
        "<div class='join'>Room <span class='room-name'>" +
          x +
          "</span>: " +
          roomList[x].length +
          " people<button class='join-button'>Join</button></div>"
      );
    }
    }
    $(".join-button").click(function() {
      let room = $(this).prev("span").text();
      joinRoom(room);
    });
  });
  $(".room-box").submit(function() {
    let room = $(".room-input").val();
    if ($.trim(room) === "") alert("Please type a room name");
    joinRoom(room);
    return false;
  });
  $(".message-box").submit(function() {
    let message = $(".message-input").val();
    $(".message-input").val("");
    let time = new Date();
    if (message) {
      $(".messages").append(createMessage(message, time, myName));
    }
    if (myRoom) {
      socket.emit("chat message", { content: message, time });
    } else {
      alert("You must join a room");
    }
    return false;
  });
  socket.on("join success", doc => {
    onSuccessfulJoinRoom(myRoom);
    for (let i = doc.length - 1; i >= 0; i--) {
      $(".messages").append(
        createMessage(doc[i].message, doc[i].time, doc[i].username)
      );
    }
  });
  socket.on("user", user => {
    let message = user.username + (user.join ? " joins room" : " leaves room");
    $(".messages").append(createNoti(message));
  });
  socket.on("chat message", message => {
    createMessage(message.content, message.time, message.name);
  });
  socket.on("errorMsg", message => alert(message));
  // join room and change room input to message input
  function joinRoom(room) {
    socket.emit("join", room);
    myRoom = room;
    $(".messages").html(createNoti("Joining room " + room));
  }
  // called when server emit 'room' event
  function onSuccessfulJoinRoom(room) {
    $("h1").html("room " + room);
    $(".messages").html(
      createNoti("Welcome to room " + room + " now you can chat")
    );
    $(".room-box").hide();
    $(".message-box").show();
  }
  function createMessage(message, time, sender) {
    let className = "message";
    let name = "",
      timeString = "";
    time = new Date(time)
    if (sender == myName) {
      className += " message-personal";
      
    } else {
      name = "<div class='name'>" + sender + "</div>";
    }
    timeString = time.getHours() + ":" + time.getMinutes();
    return (
      "<div class='" + className + "'>" + name + message + '<div class="timestamp">' + timeString + "</div>"
    );
  }
  function createNoti(message) {
    return '<div class="notification">' + message + "</div>";
  }
});
