var express = require('express');
var app = express();
//var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);

var constrainedCanvasSizes = [];
var artworkSent = false;
var NUM_PANELS = 2;
var panel_ids = [];
var lines = [
  ["I want to live somewhere other than here.", "Anywhere. I want to become a new person.", "No. More like impersonate another persona.", "Anything. A musician, artist, or scholar", "Not really. That is everything for me.", "I have decided I'm going to leave tonight.", "What is that?", "Let's go then. We leave right now."],
  ["Where would you want to go?", "You mean you want to reset your life?", "Who would you want to be?", "Are you not scared of giving up everything?", "I see ...", "And I have decided what I want to do.", "I want to assume the role of your lover."]
];
var curr_line_indexes = [0, 0]

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

    socket.on('letterDone', function(data) {
      if (socket.id == panel_ids[0]) {
        SendLetter(1);
      } else if (socket.id == panel_ids[1]) {
        SendLetter(0);
      }
    });
});

function InitiateArtwork() {
  SendInitiate();
  SendLetter(0);
  // var radius = getSmallestRadius();
  // SendCircle(0, radius, getRandomColor(), {x: constrainedCanvasSizes[0].width/2, y: constrainedCanvasSizes[0].height/2});
  // SendCircle(1, radius, getRandomColor(), {x: constrainedCanvasSizes[1].width/2, y: constrainedCanvasSizes[1].height/2});
  artworkSent = true;
}

function SendInitiate() {
  var sockets = io.sockets.sockets;
  for (var socketId in sockets) {
    sockets[socketId].emit('initiate');
  }
}

function SendLetter(panelIndex) {
  var sockets = io.sockets.sockets;
  var data = {
    letter: lines[panelIndex][curr_line_indexes[panelIndex]]
  };
  curr_line_indexes[panelIndex] = (curr_line_indexes[panelIndex] + 1) % lines[panelIndex].length;
  sockets[panel_ids[panelIndex]].emit('update', data);
}

function transformToLines(line) {
  var result = "";
  for (var i = 0; i < line.length; i++) {
    if (line[i] == " ") {
      result += " ";
    } else {
      result += "_";
    }
  }
  return result;
}

function SendCircle(panelIndex, radius, color, startingPos) {
  var sockets = io.sockets.sockets;
  var data = {
    radius: radius,
    color: color,
    startingPos: startingPos,
  };
  sockets[panel_ids[panelIndex]].emit('createCircle', data);
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
