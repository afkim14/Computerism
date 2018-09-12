var express = require('express');
var app = express();
//var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);
var clients = 0;
var colors = [];
var INTERVAL_SET = false;
var NUM_PANELS = 6;

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
  SendInitialState();
  setInterval(LifeUpdate, 2000);
  setInterval(RandomMutations, 5000);
  INTERVAL_SET = true;
}

function updateClients() {
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

function SendInitialState() {
  for (var i = 0; i < NUM_PANELS; i++) {
    colors.push([Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)]);
  }
  updateClients();
}

function LifeUpdate() {
  var rand1 = getRandomInt(0, 5);
  var rand2 = getRandomInt(0, 5);
  var options = ["kill", "mate"];
  var chosenOption = options[Math.floor(Math.random() * options.length)];
  if (chosenOption == "kill") {
    killArtwork(rand1, rand2);
  } else if (chosenOption == "mate") {
    mateArtwork(rand1, rand2);
  }
  updateClients();
}

function killArtwork(rand1, rand2) {
  var rand1_value = Math.floor((colors[rand1][0] + colors[rand1][1] + colors[rand1][2]) / 3);
  var rand2_value = Math.floor((colors[rand2][0] + colors[rand2][1] + colors[rand2][2]) / 3);
  if (rand1_value > rand2_value) {
    colors[rand2] = colors[rand1];
  } else {
    colors[rand1] = colors[rand2];
  }
}

function mateArtwork(rand1, rand2) {
  colors[rand1] = [Math.floor((colors[rand1][0] + colors[rand2][0]) / 2), Math.floor((colors[rand1][1] + colors[rand2][1]) / 2), Math.floor((colors[rand1][2] + colors[rand2][2]) / 2)];
  colors[rand2] = [Math.floor((colors[rand1][0] + colors[rand2][0]) / 2), Math.floor((colors[rand1][1] + colors[rand2][1]) / 2), Math.floor((colors[rand1][2] + colors[rand2][2]) / 2)];
}

function RandomMutations() {
  var numOfMutations = 2;
  for (var i = 0; i < numOfMutations; i++) {
    colors[getRandomInt(0, 5)] = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var port = process.env.PORT || 8080;
http.listen(port, function() {
    console.log('listening on *:' + port);
});
