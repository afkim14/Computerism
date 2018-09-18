var express = require('express');
var app = express();
//var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);

var constrainedCanvasSizes = [];
var colors = [];
var radius;
var artworkSent = false;
var NUM_PANELS = 4;
var panel_ids = [];

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('Client connected...');
    socket.on('canvasInfo', function(data) {
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
        SendArtwork(3, 0, radius, colors[0], getStartingPos(3,0), getDestination(3,0));
      } else if (socket.id == panel_ids[1]) {
        SendArtwork(2, 1, radius, colors[1], getStartingPos(2,1), getDestination(2,1));
      } else if (socket.id == panel_ids[2]) {
        SendArtwork(1, 1, radius, colors[1], getStartingPos(1,1), getDestination(1,1));
      } else if (socket.id == panel_ids[3]) {
        SendArtwork(0, 0, radius, colors[0], getStartingPos(0,0), getDestination(0,0));
      }
    });
});

function InitiateArtwork() {
  radius = getSmallestRadius();
  for (var i = 0; i < NUM_PANELS; i++) {
    colors.push(getRandomColor());
  }

  SendInitiate();
  SendArtwork(0, 0, radius, colors[0], getStartingPos(0, 0), getDestination(0, 0));
  SendArtwork(2, 1, radius, colors[1], getStartingPos(2, 1), getDestination(2, 1));
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

function getDestination(panelIndex, option) {
  var destination;
  if (option == 0) {
    destination = {
      emit_destination: [constrainedCanvasSizes[panelIndex].width - radius, constrainedCanvasSizes[panelIndex].height - radius],
      dead_destination: [constrainedCanvasSizes[panelIndex].width + radius, constrainedCanvasSizes[panelIndex].height + radius],
      tolerance: 0.5
    };
  } else if (option == 1) {
    destination = {
      emit_destination: [constrainedCanvasSizes[panelIndex].width - radius, 0 + radius],
      dead_destination: [constrainedCanvasSizes[panelIndex].width + radius, 0 - radius],
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
      y: 0-radius
    };
  } else if (option == 1) {
    startingPos = {
      x: 0-radius,
      y: constrainedCanvasSizes[panelIndex].height + radius
    };
  }
  return startingPos;
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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var port = process.env.PORT || 8080;
http.listen(port, function() {
    console.log('listening on *:' + port);
});
