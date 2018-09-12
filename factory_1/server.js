var express = require('express');
var app = express();
//var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);

var constrainedCanvasWidth;
var constrainedCanvasHeight;
var radius;
var square_size;
var circleColor1;
var squareColor1;
var destination1;
var destination2;
var startingPos1;
var startingPos2;
var artworkSent = false;
var NUM_PANELS = 2;
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
        SendSquare(1, 0, square_size, squareColor1, startingPos2, destination2);
      }
    });
});

function InitiateArtwork() {
  constrainedCanvasWidth = 300;
  constrainedCanvasHeight = 300;
  SendCanvasInfo();

  var factoryPos = {x: constrainedCanvasWidth/2, y: constrainedCanvasHeight/2};
  var factorySize = [100, 100];
  var factoryColors = [];
  for (var i = 0; i < 2; i ++) {
    factoryColors.push({r: getRandomInt(0, 255), g: getRandomInt(0, 255), b: getRandomInt(0, 255)});
  }

  var factoryPos2 = {x: constrainedCanvasWidth/2 - factorySize[0]/2, y: constrainedCanvasHeight/2}
  SendFactory(0, factoryPos, factorySize, factoryColors);
  SendFactory(1, factoryPos2, factorySize, factoryColors);

  radius = 30;
  circleColor1 = {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256)
  };
  var padding = 10;
  destination1 = {
    destinations: [
                    [0+radius, constrainedCanvasHeight - radius],
                    [constrainedCanvasWidth-radius, constrainedCanvasHeight - radius],
                    [constrainedCanvasWidth-radius, 0 + radius],
                    [0+(2*radius) + padding, 0 + radius],
                    [0+(2*radius) + padding, constrainedCanvasHeight - (radius*2) - padding],
                    [constrainedCanvasWidth - (radius*2) - padding, constrainedCanvasHeight - (radius*2) - padding],
                    [constrainedCanvasWidth - (radius*2) - padding, constrainedCanvasHeight/2],
                    [constrainedCanvasWidth/2, constrainedCanvasHeight/2]
                  ],
    tolerance: 0.5
  };
  startingPos1 = {
    x: 0+radius,
    y: 0-radius
  };

  square_size = [30, 30];
  squareColor1 = circleColor1;
  startingPos2 = factoryPos2;
  destination2 = {
    destinations: [[constrainedCanvasWidth + square_size[0], constrainedCanvasHeight/2]],
    tolerance: 0.5
  };

  SendCircle(0, 0, radius, circleColor1, startingPos1, destination1);
  artworkSent = true;

  setInterval(nextCircle, 1000);
}

function nextCircle() {
  SendCircle(0, 0, radius, circleColor1, startingPos1, destination1);
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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var port = process.env.PORT || 8080;
http.listen(port, function() {
    console.log('listening on *:' + port);
});
