var express = require('express');
var app = express();
//var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);
var clients = 0;
var INTERVAL_SET = false;
var NUM_PANELS = 3;

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('Client connected...');
    clients++;
    if (clients >= NUM_PANELS && !INTERVAL_SET) {
      setTimeout(InitiateArtwork, 500);
    }
});

io.on('disconnect', function(socket) {
  clients--;
});

function InitiateArtwork() {
  SendArtwork();
  setInterval(SendArtwork, 3000);
  INTERVAL_SET = true;
}

function SendArtwork() {
  var colors = [];
  var baseColor = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
  for (var i = 0; i < NUM_PANELS; i++) {
    var newColor = Array.from(baseColor);
    newColor[i] = (newColor[i] + 20) % 255; // oooooo
    colors.push(newColor);
  }

  var sockets = io.sockets.sockets;
  var currColorIndex = 0;
  for (var socketId in sockets)
  {
    var socket = sockets[socketId];
    var data = {
      color : colors[currColorIndex]
    };
    currColorIndex++;
    socket.emit('update', data);
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var port = process.env.PORT || 8080;
http.listen(port, function() {
    console.log('listening on *:' + port);
});
