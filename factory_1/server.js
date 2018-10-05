var express = require('express');
var app = express();
//var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);

var constrainedCanvasSizes = [];
var colors = [];
var radius;
var squareSize;
var factorySize;
var circleColor;
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
        squareSize = [getSmallestRadius(), getSmallestRadius()];
        var squareColor = circleColor;
        var startingPos = getFactoryPosition(1);
        var destination = getDestination(1, 1);
        SendSquare(1, 0, squareSize, squareColor, startingPos, destination);
      } else if (socket.id == panel_ids[1]) {
        var squareColor = circleColor;
        SendSquare(2, 0, squareSize, squareColor, getStartingPos(2, 2), getDestination(2, 2));
      }
    });
});

function InitiateArtwork() {
  CreateAndSendFactories();
  radius = getSmallestRadius();
  circleColor = getRandomColor();
  SendInitiate();
  SendCircle(0, 0, radius, circleColor, getStartingPos(0, 0), getDestination(0, 0));
  artworkSent = true;
  setInterval(nextCircle, 4000);
}

function nextCircle() {
  SendCircle(0, 0, radius, circleColor, getStartingPos(0, 0), getDestination(0, 0));
}

function SendInitiate() {
  var sockets = io.sockets.sockets;
  for (var socketId in sockets) {
    sockets[socketId].emit('initiate');
  }
}

function SendCircle(panelIndex, circleId, radius, color, startingPos, destination) {
  var sockets = io.sockets.sockets;
  var data = {
    circleId: circleId,
    radius: radius,
    color: color,
    startingPos: startingPos,
    movement: destination
  };
  sockets[panel_ids[panelIndex]].emit('createCircle', data);
}

function CreateAndSendFactories() {
  factorySize = [getSmallestRadius()*2, getSmallestRadius()*2];
  var factoryColors = [];
  for (var i = 0; i < 2; i ++) {
    factoryColors.push(getRandomColor());
  }
  SendFactory(0, getFactoryPosition(0), factorySize, factoryColors);
  SendFactory(1, getFactoryPosition(1), factorySize, factoryColors);
}

function SendFactory(panelIndex, pos, size, colors) {
  var sockets = io.sockets.sockets;
  var data = {
    pos: pos,
    size: size,
    colors: colors
  };
  sockets[panel_ids[panelIndex]].emit('createFactory', data);
}

function SendSquare(panelIndex, squareId, size, color, startingPos, destination) {
  var sockets = io.sockets.sockets;
  var data = {
    squareId: squareId,
    size: size,
    color: color,
    startingPos: startingPos,
    movement: destination
  };
  sockets[panel_ids[panelIndex]].emit('createSquare', data);
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

function getFactoryPosition(panelIndex) {
  var pos;
  if (panelIndex == 0) {
    pos = {
      x: constrainedCanvasSizes[panelIndex].width/2,
      y: constrainedCanvasSizes[panelIndex].height/2
    }
  } else if (panelIndex == 1) {
    pos = {
      x: constrainedCanvasSizes[panelIndex].width/2 - factorySize[0]/2,
      y: constrainedCanvasSizes[panelIndex].height/2
    }
  }
  return pos;
}

function getDestination(panelIndex, option) {
  var destination;
  var padding = 10;
  if (option == 0) {
    destination = {
      destinations: [
                      [0+radius, constrainedCanvasSizes[panelIndex].height/2],
                      [constrainedCanvasSizes[panelIndex].width/2, constrainedCanvasSizes[panelIndex].height/2]
                    ],
      tolerance: 1.0
    };
  } else if (option == 1) {
    destination = {
      destinations: [[constrainedCanvasSizes[panelIndex].width + squareSize[0], constrainedCanvasSizes[panelIndex].height/2]],
      tolerance: 1.0
    };
  } else if (option == 2) {
    destination = {
      destinations: [
        [constrainedCanvasSizes[panelIndex].width/2, constrainedCanvasSizes[panelIndex].height/2],
        [constrainedCanvasSizes[panelIndex].width/2, constrainedCanvasSizes[panelIndex].height + radius]
      ],
      tolerance: 1.0
    };
  }
  return destination;
}

function getStartingPos(panelIndex, option) {
  var startingPos;
  if (option == 0) {
    startingPos = {
      x: 0+radius,
      y: 0-radius
    };
  } else if (option == 1) {
    startingPos = {
      x: constrainedCanvasSizes[panelIndex].width+radius,
      y: constrainedCanvasSizes[panelIndex].height/2
    };
  } else if (option == 2) {
    startingPos = {
      x: 0-radius,
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
