var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s",
                "t", "u", "v", "w", "x", "y", "z"];
var currLetterIndex = 0;

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

var port = process.env.PORT || 8080;
http.listen(port, function() {
  console.log('listening on *:' + port);
});

io.on('connection', function(socket) {
  console.log('Client connected...');
  setTimeout(function() {SendLetter(socket.id);}, 500);

  socket.on('letterDone', function() {
    SendLetter(socket.id);
  });
});

function SendLetter(socketid) {
  var backgroundColor = { r: 234, g: 234, b: 234 };
  var data = {
    bgColor: backgroundColor,
    letter: alphabet[currLetterIndex++ % alphabet.length]
  }
  io.to(socketid).emit('update', data);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
