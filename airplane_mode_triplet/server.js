var express = require('express');
var app = express();
//var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);

var radius;
var constrainedCanvasSizes = [];
var colors = [];
var destinations = [];
var startingPositions = [];
var ticks = [];

var artworkSent = false;
var NUM_PANELS = 3;
var panel_ids = [];

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('Client connected...');
    socket.on('canvasInfo', function(data) {
      var canvasWidth = data.width;
      var canvasHeight = data.height;

      if (panel_ids.length < NUM_PANELS) {
        panel_ids.push(socket.id);
        constrainedCanvasSizes.push({width: canvasWidth, height: canvasHeight});
      }

      if (panel_ids.length >= NUM_PANELS && !artworkSent) {
        setTimeout(InitiateArtwork, 500);
      }
    });

    socket.on('circle_edge', function(data) {
      if (socket.id == panel_ids[0]) {
        if (ticks[0]) {
          SendArtwork(0, 0, radius, colors[0], getStartingPos(0, 2), getDestination(0, 2));
        } else {
          SendArtwork(0, 0, radius, colors[0], getStartingPos(0, 0), getDestination(0, 0));
        }
        ticks[0] = !ticks[0];
      } else if (socket.id == panel_ids[1]) {
        //
        //
        //
        //
      } else if (socket.id == panel_ids[2]) {
        if (ticks[2]) {
          SendArtwork(2, 1, radius, colors[2], getStartingPos(2, 0), getDestination(2, 0));
        } else {
          SendArtwork(2, 1, radius, colors[2], getStartingPos(2, 2), getDestination(2, 2));
        }
        ticks[2] = !ticks[2];
      }
    });
});

function InitiateArtwork() {
  for (var i = 0; i < NUM_PANELS; i++) {
    colors.push(getRandomColor());
    ticks.push(true);
  }

  radius = getSmallestRadius();
  SendInitiate();

  SendArtwork(0, 0, radius, colors[0], getStartingPos(0, 0), getDestination(0, 0));
  SendArtwork(2, 1, radius, colors[2], getStartingPos(2, 2), getDestination(2, 2));
  SendBackground(1, {r: 255, g: 61, b: 56});
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

function SendBackground(panelIndex, color) {
  var sockets = io.sockets.sockets;
  var data = {
    color: color,
  };
  sockets[panel_ids[panelIndex]].emit('changeBackground', data);
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

function getRandomColor() {
  var color = {
    r: getRandomInt(0, 255),
    g: getRandomInt(0, 255),
    b: getRandomInt(0, 255)
  };
  return color;
}

function getDestination(panelIndex, option) {
  var destination;
  if (option == 0) {
    destination = {
      emit_destination: [constrainedCanvasSizes[panelIndex].width - radius, constrainedCanvasSizes[panelIndex].height/2],
      dead_destination: [constrainedCanvasSizes[panelIndex].width + radius, constrainedCanvasSizes[panelIndex].height/2],
      tolerance: 0.5
    };
  } else if (option == 2) {
    destination = {
      emit_destination: [0 + radius, constrainedCanvasSizes[panelIndex].height/2],
      dead_destination: [0 - radius, constrainedCanvasSizes[panelIndex].height/2],
      tolerance: 0.5
    };
  }
  return destination;
}

function getStartingPos(panelIndex, option) {
  var startingPos;
  if (option == 0) {
    startingPos = {
      x: 0-radius,
      y: constrainedCanvasSizes[panelIndex].height/2
    };
  } else if (option == 2) {
    startingPos = {
      x: constrainedCanvasSizes[panelIndex].width+radius,
      y: constrainedCanvasSizes[panelIndex].height/2
    };
  }
  return startingPos;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var port = process.env.PORT || 8080;
http.listen(port, function() {
    console.log('listening on *:' + port);
});
