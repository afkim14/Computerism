var express = require('express');
var app = express();
//var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);

var constrainedCanvasWidth;
var constrainedCanvasHeight;
var radius;
var circleColor1;
var circleColor2;
var destination1;
var destination2;
var startingPos1;
var startingPos2;
var artworkSent = false;
var NUM_PANELS = 4;
var panel_ids = [];

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('Client connected...');
    if (panel_ids.length < NUM_PANELS) {
      panel_ids.push(socket.id);
    }

    if (panel_ids.length >= NUM_PANELS && !artworkSent) {
      setTimeout(InitiateArtwork, 500);
    }

    socket.on('circle_edge', function(data) {
      if (socket.id == panel_ids[0]) {
        SendArtwork(3, 0, radius, circleColor1, startingPos1, destination1);
      } else if (socket.id == panel_ids[1]) {
        SendArtwork(2, 1, radius, circleColor2, startingPos2, destination2);
      } else if (socket.id == panel_ids[2]) {
        SendArtwork(1, 1, radius, circleColor2, startingPos2, destination2);
      } else if (socket.id == panel_ids[3]) {
        SendArtwork(0, 0, radius, circleColor1, startingPos1, destination1);
      }
    });
});

function InitiateArtwork() {
  constrainedCanvasWidth = 300;
  constrainedCanvasHeight = 300;
  SendCanvasInfo();

  radius = 30;
  circleColor1 = {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256)
  };
  circleColor2 = {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256)
  };
  destination1 = {
    emit_destination: [constrainedCanvasWidth - radius, constrainedCanvasHeight - radius],
    dead_destination: [constrainedCanvasWidth + radius, constrainedCanvasHeight + radius],
    tolerance: 0.5
  };
  destination2 = {
    emit_destination: [constrainedCanvasWidth - radius, 0 + radius],
    dead_destination: [constrainedCanvasHeight + radius, 0 - radius],
    tolerance: 0.5
  };
  startingPos1 = {
    x: 0-radius,
    y: 0-radius
  };
  startingPos2 = {
    x: 0-radius,
    y: constrainedCanvasHeight + radius
  };

  SendArtwork(0, 0, radius, circleColor1, startingPos1, destination1);
  SendArtwork(2, 1, radius, circleColor2, startingPos2, destination2);
  artworkSent = true;
}

function SendCanvasInfo() {
  var sockets = io.sockets.sockets;
  var data = {
    width: constrainedCanvasWidth,
    height: constrainedCanvasHeight
  }
  for (var socketId in sockets) {
    sockets[socketId].emit('canvasInfo', data);
  }
}

function SendArtwork(panelIndex, circleId, radius, color, startingPos, destination) {
  var sockets = io.sockets.sockets;
  var data = {
    circleId: circleId,
    radius: radius,
    color: color,
    startingPos: startingPos,
    destination: destination
  };
  sockets[panel_ids[panelIndex]].emit('createCircle', data);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var port = process.env.PORT || 8080;
http.listen(port, function() {
    console.log('listening on *:' + port);
});
