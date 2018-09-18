var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var currScaleIndex = -1;
var currKeyIndex = -1;
var notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var ranges = ["3", "4", "5"];
var NoteType = {
  R: 0,
  H: 1,
  W: 2,
  WH: 3,
};
var scales = [
  [NoteType.R, NoteType.W, NoteType.W, NoteType.H, NoteType.W, NoteType.W, NoteType.W, NoteType.H],
  [NoteType.R, NoteType.W, NoteType.H, NoteType.W, NoteType.W, NoteType.H, NoteType.W, NoteType.H],
  [NoteType.R, NoteType.W, NoteType.H, NoteType.W, NoteType.W, NoteType.W, NoteType.W, NoteType.H],
  [NoteType.R, NoteType.W, NoteType.H, NoteType.W, NoteType.W, NoteType.H, NoteType.WH, NoteType.H]
];

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

var port = process.env.PORT || 8080;
http.listen(port, function() {
    console.log('listening on *:' + port);
});

io.on('connection', function(socket) {
    console.log('Client connected...');
    if (currScaleIndex == -1 && currKeyIndex == -1) {
      currKeyIndex = Math.floor(Math.random() * notes.length);
      currScaleIndex = Math.floor(Math.random() * scales.length);
      setInterval(sendNotes, 2000);
    }

    var nextColor = createRandomColor();
    var nextNote = createRandomNote();

    var data = {
      r : nextColor.r,
      g : nextColor.g,
      b : nextColor.b,
      note : nextNote,
    };

    setTimeout(function() {socket.emit('update', data);}, 500);
});

function sendNotes() {
  var sockets = io.sockets.sockets;
  for (var socketId in sockets)
  {
    var socket = sockets[socketId];
    var nextColor = createRandomColor();
    var nextNote = createRandomNote();
    var data = {
      r : nextColor.r,
      g : nextColor.g,
      b : nextColor.b,
      note : nextNote,
    };
    socket.emit('update', data);
  }
}

function createRandomColor() {
  var data = {
      r : Math.floor(Math.random() * 256),
      g : Math.floor(Math.random() * 256),
      b : Math.floor(Math.random() * 256),
  };
  return data;
}

function createRandomNote() {
  return notes[getRandomInt(0, notes.length-1)] + ranges[getRandomInt(0, ranges.length-1)];
}

// NOT BEING USED AT THE MOMENT
function createRandomScaleNote() {
  var rand_scale_note_index = scales[currScaleIndex][Math.floor(Math.random() * scales[currScaleIndex].length)];
  var nextNoteIndex = currKeyIndex;
  for (var i = 0; i <= rand_scale_note_index; i++) {
    nextNoteIndex += scales[currScaleIndex][i];
  }
  var rand_octave = ranges[Math.floor(Math.random() * ranges.length)];
  return notes[nextNoteIndex % notes.length] + rand_octave;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
