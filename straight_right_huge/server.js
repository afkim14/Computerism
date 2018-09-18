var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var constrainedCanvasSizes = [];
var color;
var radius;
var artworkSent = false;
var NUM_PANELS = 3;
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
      currPanel = (currPanel + 1) % NUM_PANELS;
      SendArtwork(currPanel, 0, radius, color, getStartingPos(currPanel), getDestination(currPanel));
    });
});

function InitiateArtwork() {
  radius = getLargestRadius();
  color = getRandomColor();
  currPanel = 0;
  destination = getDestination(currPanel);
  startingPos = getStartingPos(currPanel);
  SendInitiate();
  SendArtwork(currPanel, 0, radius, color, startingPos, destination);
  artworkSent = true;
}

function SendInitiate() {
  var sockets = io.sockets.sockets;
  for (var socketId in sockets) {
    sockets[socketId].emit('initiate');
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

function getDestination(panelIndex) {
  var destination = {
    emit_destination: [constrainedCanvasSizes[panelIndex].width - radius, constrainedCanvasSizes[panelIndex].height/2],
    dead_destination: [constrainedCanvasSizes[panelIndex].width + radius, constrainedCanvasSizes[panelIndex].height/2],
    tolerance: 0.5
  };
  return destination;
}

function getStartingPos(panelIndex) {
  var startingPos = {
    x: 0-radius,
    y: constrainedCanvasSizes[panelIndex].height/2
  };
  return startingPos;
}

function getRandomColor() {
  var color = {
    r: getRandomInt(0, 255),
    g: getRandomInt(0, 255),
    b: getRandomInt(0, 255)
  };
  return color;
}

function getLargestRadius() {
  var largestHeight = constrainedCanvasSizes[0].height;
  for (var i = 1; i < NUM_PANELS; i++) {
    if (constrainedCanvasSizes[i].width > largestHeight) {
      largestHeight = constrainedCanvasSizes[i].height;
    }
  }
  var radius = largestHeight*1.2;
  return radius;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var port = process.env.PORT || 8080;
http.listen(port, function() {
    console.log('listening on *:' + port);
});
