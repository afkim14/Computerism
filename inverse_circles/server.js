var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var constrainedCanvasSizes = [];
var color;
var radius;
var artworkSent = false;
var NUM_PANELS = 2;
var panel_ids = [];

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('Client connected...');
    socket.on('canvasInfo', function (data) {
      if (panel_ids.length < NUM_PANELS) {
        panel_ids.push(socket.id);
        constrainedCanvasSizes.push({width: data.width, height: data.height});
      }

      if (panel_ids.length >= NUM_PANELS && !artworkSent) {
        setTimeout(InitiateArtwork, 500);
      }
    });

    socket.on('circle_edge', function(data) {
       if (socket.id == panel_ids[0]) {
        SendArtwork(1, 1, radius, color, {x: constrainedCanvasSizes[1].width/2, y: constrainedCanvasSizes[1].height/2});
       } else if (socket.id == panel_ids[1]) {
        SendArtwork(0, 0, radius, color, {x: constrainedCanvasSizes[0].width/2, y: constrainedCanvasSizes[0].height/2});
       }
    });
});

function InitiateArtwork() {
  radius = 0;
  color = getRandomColor();
  SendInitiate();
  SendArtwork(0, 0, radius, color, {x: constrainedCanvasSizes[0].width/2, y: constrainedCanvasSizes[0].height/2});
  artworkSent = true;
}

function SendInitiate() {
  var sockets = io.sockets.sockets;
  for (var socketId in sockets) {
    sockets[socketId].emit('initiate');
  }
}

function SendArtwork(panelIndex, circleId, radius, color, startingPos) {
  var sockets = io.sockets.sockets;
  var data = {
    circleId: circleId,
    radius: radius,
    color: color,
    startingPos: startingPos,
  };
  sockets[panel_ids[panelIndex]].emit('createCircle', data);
}

function getRandomColor() {
  var color = {
    r: getRandomInt(0, 255),
    g: getRandomInt(0, 255),
    b: getRandomInt(0, 255)
  };
  return color;
}

function getSmallestRadius() {
  var smallestWidth = constrainedCanvasSizes[0].width;
  for (var i = 1; i < NUM_PANELS; i++) {
    if (constrainedCanvasSizes[i].width < smallestWidth) {
      smallestWidth = constrainedCanvasSizes[i].width;
    }
  }
  var radius = Math.floor(smallestWidth/10);
  return radius;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var port = process.env.PORT || 8080;
http.listen(port, function() {
    console.log('listening on *:' + port);
});
