$(document).ready(function () {
    const socket = io()
    let room;
    $('#room-input').submit(function () {
        room = $('#room-input input').val()
        $('#room-input input').val('');
        if ($.trim(room) === '') {
            alert('Please type a room');
        } else {
            socket.emit('join', room)
        }
        return false;
    })
    $('#chat-input').submit(function () {
        let message = $('#chat-input input').val();
        $('#chat-input input').val('');
        if (room) {
            console.log(message);
            let time = new Date()
            socket.emit('chat message', { content: message, time: time })
            $('#messages').append(
                $('<li class=\'me\'>').html(message)
            )
        } else alert('You must join a room')
        return false; // prevent default refresh
    })
    socket.on('error', message => {
        alert(message)
    })
    socket.on('chat message', (message) => {
        console.log(message)
        $('#messages').append(
            $('<li class=\'other\'>').html('<b>' + message.name + '</b> : ' + message.content)
        )
    })
})

