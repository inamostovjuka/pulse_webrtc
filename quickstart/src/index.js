'use strict';
var Video = require('twilio-video');
var Rickshaw = require('rickshaw');
var normalize = require('./math');
var dataSend = require('WebSocketServer');
var activeRoom;
var previewTracks;
var identity;
var roomName;

// Attach the Tracks to the DOM.
function attachTracks(tracks, container) {
  tracks.forEach(function(track) {
    container.appendChild(track.attach());
  });
}

// Attach the Participant's Tracks to the DOM.
function attachParticipantTracks(participant, container) {
  var tracks = Array.from(participant.tracks.values());
  attachTracks(tracks, container);
}

// Detach the Tracks from the DOM.
function detachTracks(tracks) {
  tracks.forEach(function(track) {
    track.detach().forEach(function(detachedElement) {
      detachedElement.remove();
    });
  });
}

// Detach the Participant's Tracks from the DOM.
function detachParticipantTracks(participant) {
  var tracks = Array.from(participant.tracks.values());
  detachTracks(tracks);
}

// When we are about to transition away from this page, disconnect
// from the room, if joined.
window.addEventListener('beforeunload', leaveRoomIfJoined);

// Obtain a token from the server in order to connect to the Room.
$.getJSON('/token', function(data) {
  identity = data.identity;
  document.getElementById('room-controls').style.display = 'block';

  // Bind button to join Room.
  document.getElementById('button-join').onclick = function() {
    roomName = document.getElementById('room-name').value;
    if (!roomName) {
      alert('Lūdzu ievadiet istabas nosaukumu');
      return;
    }

    log("Pievienojas istabai '" + roomName + "'...");
    var connectOptions = {
      name: roomName,
      logLevel: 'debug'
    };

    if (previewTracks) {
      connectOptions.tracks = previewTracks;
    }

    // Join the Room with the token from the server and the
    // LocalParticipant's Tracks.
    Video.connect(data.token, connectOptions).then(roomJoined, function(error) {
      log('Nevar savienot Twilio: ' + error.message);
    });
  };

  // Bind button to leave Room.
  document.getElementById('button-leave').onclick = function() {
    log('Pamest istabu...');
    activeRoom.disconnect();
  };
});

// Successfully connected!
function roomJoined(room) {
  window.room = activeRoom = room;
//sūta datus!!!!!!!!!!!!!!!!!!!!!!!!!
  //  var dataTrack = new video.LocalDataTrack();
  //  dataTrack.send();
  // //
  //  room.localParticipant.addTrack(dataTrack);

  log("Pievienojās kā '" + identity + "'");
  document.getElementById('button-join').style.display = 'none';
  document.getElementById('button-leave').style.display = 'inline';

  // Attach LocalParticipant's Tracks, if not already attached.
  var previewContainer = document.getElementById('local-media');
  if (!previewContainer.querySelector('video')) {
    attachParticipantTracks(room.localParticipant, previewContainer);
  }

  // Attach the Tracks of the Room's Participants.
  room.participants.forEach(function(participant) {
    log("Šobrīd istabā '" + participant.identity + "'");
    var previewContainer = document.getElementById('remote-media');
    attachParticipantTracks(participant, previewContainer);
  });

  // When a Participant joins the Room, log the event.
  room.on('participantConnected', function(participant) {
    log("Pievienojas '" + participant.identity + "'");
  });

  // When a Participant adds a Track, attach it to the DOM.
  room.on('trackAdded', function(track, participant) {
      console.log('RemoteVideoTrackReceived');
  // if (track instanceof RemoteDataTrack){
//console.log('ina');
  //   return;

//       };
//      if (track.kind === 'data') {
//            console.log('Inaaaaa');
//        tracker.on('track', function(event) {
//          context.clearRect(0, 0, canvas.width, canvas.height);
// //
// //         event.data.forEach(function(rect) {
// //           context.strokeStyle = '#a64ceb';
// //           context.strokeRect(rect.x, rect.y, rect.width, rect.height);
// //           context.font = '11px Helvetica';
// //           context.fillStyle = "#fff";
// //           context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
// //           context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
//           });
// //        });
//       };
// //  };
  //   return;

    log(participant.identity + " Pievienots " + track.kind);
    var previewContainer = document.getElementById('remote-media');
    attachTracks([track], previewContainer);
  });

  // When a Participant removes a Track, detach it from the DOM.
  room.on('trackRemoved', function(track, participant) {
    log(participant.identity + " removed track: " + track.kind);
    detachTracks([track]);
  });

  // When a Participant leaves the Room, detach its Tracks.
  room.on('participantDisconnected', function(participant) {
    log("Lietotājs '" + participant.identity + "' pameta istabu");
    detachParticipantTracks(participant);
  });

  // Once the LocalParticipant leaves the room, detach the Tracks
  // of all Participants, including that of the LocalParticipant.
  room.on('disconnected', function() {
    log('Atvienojās');
    if (previewTracks) {
      previewTracks.forEach(function(track) {
        track.stop();
      });
    }
    detachParticipantTracks(room.localParticipant);
    room.participants.forEach(detachParticipantTracks);
    activeRoom = null;
    document.getElementById('button-join').style.display = 'inline';
    document.getElementById('button-leave').style.display = 'none';
  });
}

// Preview LocalParticipant's Tracks.
document.getElementById('button-preview').onclick = function() {

  var localTracksPromise = previewTracks
    ? Promise.resolve(previewTracks)
    : Video.createLocalTracks();

  localTracksPromise.then(function(tracks) {
    window.previewTracks = previewTracks = tracks;
    var previewContainer = document.getElementById('local-media');
    if (!previewContainer.querySelector('video')) {
      attachTracks(tracks, previewContainer);
    }
  }, function(error) {
    console.error('Unable to access local media', error);
    log('Neizdodas piekļūt kamerai un mikrafonam');
  });

  //   window.onload = function() {
          var width = 380;
          var height = 285;
          var video = document.getElementById('video');
          var canvas = document.getElementById('canvas');
          var context = canvas.getContext('2d');
          var canvasOverlay = document.getElementById('canvasOverlay');
  //        canvasOverlay.setAttribute("width", width);
//          canvasOverlay.setAttribute("height", height);
          var overlayContext = canvasOverlay.getContext('2d');
          var tracker = new tracking.ObjectTracker('face');
          var rawDataGraphic;
          var heartrate = 60;
          var bufferWindow = 512;
          var sendingData = false;
          var spectrum;
          var confidenceGraph, x, y, line, xAxis;
          var heartrateAverage = [];
          var circle, circleSVG, r;
          var toggle = 1;
          var hrAv = 65;
          var graphing = false;
          var fps = 15;
          var forehead;
          var graphData;
          var renderTimer;
          var dataSend;
          var heartbeatTimer;
          var confidenceGraph;

  //        canvasOverlay.clearRect(0, 0, width, height);

          var red = [];
          var green = [];
          var blue = [];

          navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
          window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

      //    overlayContext.clearRect(0, 0, video.width, video.height);

          rawDataGraphic = new Rickshaw.Graph ( {
            element: document.getElementById("rawDataGraphic"),
            width: 600,
            height: 120,
            renderer: "line",
            min: -2,
            interpolation: "basis",
            series: new Rickshaw.Series.FixedDuration([{ name: "one" }], undefined, {
              timeInterval: 1000/fps,
              maxDataPoints: 300,
              time: new Date().getTime() / 1000
            })
          });

          // red = [];
          // green = [];
          // blue = [];
          // confidenceGraph = null;
          // clearConfidenceGraph();

          function clearConfidenceGraph(){
            var confidenceClear = document.getElementById("confidenceGraph");
            while (confidenceClear.firstChild){
              confidenceClear.removeChild(confidenceClear.firstChild);
            }
          }

          renderTimer = setInterval(function(){
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
          }, Math.round(1000 / fps));

          heartbeatTimer = setInterval(function(){
            var duration = Math.round(((60/hrAv) * 1000)/4);
            if (confidenceGraph){
               if (toggle % 2 == 0){
                  circleSVG.select("circle")
                         .transition()
                         .attr("r", r)
                         .duration(duration);
                } else {
                  circleSVG.select("circle")
                         .transition()
                         .attr("r", r + 15)
                         .duration(duration);
                }
                if (toggle == 10){
                  toggle = 0;
                }
                toggle++;
              }
          }, Math.round(((60/hrAv) * 1000)/2));



          tracker.setInitialScale(4);
          tracker.setStepSize(2);
          tracker.setEdgesDensity(0.1);

          tracking.track('#video', tracker, { camera: true });

          tracker.on('track', function(event) {
            overlayContext.clearRect(0, 0, canvas.width, canvas.height);

            event.data.forEach(function(rect) {
              overlayContext.strokeStyle = '#a64ceb';
              overlayContext.strokeRect((rect.x)+20, (rect.y)-15, rect.width, (rect.height)-40);
              overlayContext.font = '11px Helvetica';
            //   context.fillStyle = "#fff";
            //   context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 2, rect.y + 11);
            //   context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
               document.addEventListener("facetracking", greenRect())
            });
            function greenRect() {
      //        overlayContext.clearRect(0, 0, canvas.width, canvas.height);
              var width = canvas.width;
              var height = canvas.height;
            event.data.forEach(function(rct) {
              var sx, sy, sw, sh, forhead, inpos, outpos;
              var greenSum = 0;
              var redSum = 0;
              var blueSum = 0;
              // forehead based on facetrackingrct
              sx = rct.x + (-(rct.width/5)) + 80 ;
              sy = rct.y + (-(rct.height/3)) + 25 ;
              sw = (rct.width/5) ;
              sh = (rct.width/10) ;

        //      if (rct.detection == "CS") {
          //     overlayContext.rotate(rct.angle-(Math.PI/2));
          //     overlayContext.strokeStyle = "#00CC00";
          //     overlayContext.strokeRect((rct.x)+20 + (-(rct.width/2)), (rct.y)+35 + (-(rct.width/2)), rct.width, (rct.width)-40);
          // for debugging: blue forehead box
                overlayContext.strokeStyle = "#33CCFF";
                overlayContext.strokeRect(sx, sy, sw, sh);
          // turn green
                forehead = context.getImageData(sx, sy, sw, sh);
                //for each frame get summ of forehead green area
                var i;
                for (i = 0; i < forehead.data.length; i+=4) {
                  redSum = forehead.data[i] + redSum;
                  greenSum = forehead.data[i+1] + greenSum;
                  blueSum = forehead.data[i+2] + blueSum;

                }


                var redAverage = redSum/(forehead.data.length/4);
                var greenAverage = greenSum/(forehead.data.length/4);
                var blueAverage = blueSum/(forehead.data.length/4);

                if (green.length < bufferWindow){

                  red.push(redAverage);
                  green.push(greenAverage);
                  blue.push(blueAverage);
                  if (green.length > bufferWindow/8){
                    sendingData = true;
                  }
                } else {
                  red.push(redAverage);
                  red.shift();
                  green.push(greenAverage);
                  green.shift();
                  blue.push(blueAverage);
                  blue.shift();
                }
                graphData = {one: normalize(green)[green.length-1]}
                rawDataGraphic.series.addData(graphData);
                rawDataGraphic.update();

                if (graphing === false){
                  var rickshawAxis = document.getElementById("rawDataLabel");
                  rickshawAxis.style.display = "block";
                  graphing = true;
                }
            //    overlayContext.rotate((Math.PI/2)-event.angle);
          //    }
            })
          }
          // countdown time
          // function drawCountdown(array){
          //   countdownContext.font = "20pt Helvetica";
          //   countdownContext.clearRect(0,0,200,100);
          //   countdownContext.save();
          //   countdownContext.fillText(((bufferWindow - array.length)/fps) >> 0, 25, 25);
          //   countdownContext.restore();
          // }

          function cardiac(array, bfwindow) {
            console.log("cardiac");
            spectrum = array;
            var freqs = frequencyExtract(spectrum, fps);
            var freq = freqs.freq_in_hertz;
            heartrate = freq * 60;

            showConfidenceGraph(freqs,600, 100);
            heartbeatCircle(heartrate);
            // measuring pulsing cicle and create average of last five results
            if (heartrateAverage.length < 3){
              heartrateAverage.push(heartrate);
              hrAV = heartrate;
            } else {
              heartrateAverage.push(heartrate);
              heartrateAverage.shift();
              hrAv = mean(heartrateAverage);
            }
          };

          function heartbeatCircle(heartrate){
              console.log("hearbeatcircle");
              var cx = $("#heartbeat").width() / 2;
              var cy = $("#heartbeat").width() / 2;
              r = $("#heartbeat").width() / 4;

              if (circle) {
                circleSVG.select("text").text(heartrate >> 0);

              } else {
                circleSVG = d3.select("#heartbeat")
                              .append("svg")
                              .attr("width", cx * 2)
                              .attr("height", cy * 2);
                circle = circleSVG.append("circle")
                                  .attr("cx", cx)
                                  .attr("cy", cy)
                                  .attr("r", r)
                                  .attr("fill", "#DA755C");
                circleSVG.append("text")
                         .text(heartrate >> 0)
                         .attr("text-anchor", "middle")
                         .attr("x", cx )
                         .attr("y", cy + 10)
                         .attr("font-size", "26pt")
                         .attr("fill", "white");
              }
            }

            function showConfidenceGraph(data, width, height){
              console.log("confidencegraph");
  // **  x == filteredFreqBin, y == normalizedFreqs **
  var max = _.max(data.normalizedFreqs);
  data.filteredFreqBin = _.map(data.filteredFreqBin, function(num){return num * 60});
  var data = _.zip(data.normalizedFreqs, data.filteredFreqBin);

  if (confidenceGraph){
    y = d3.scale.linear().domain([ 0, max]).range([height, 0]);
    confidenceGraph.select("path").transition().attr("d", line(data)).attr("class", "line").ease("linear").duration(750);
  } else {
    x = d3.scale.linear().domain([48, 180]).range([0, width - 20]);
    y = d3.scale.linear().domain([0, max]).range([height, 0]);

    confidenceGraph = d3.select("#confidenceGraph").append("svg").attr("width", width).attr("height", 150);

    xAxis = d3.svg.axis().scale(x).tickSize(-height).tickSubdivide(true);

    line = d3.svg.line()
                  .x(function(d) { return x(+d[1]); })
                  .y(function(d) { return y(+d[0]); });

    confidenceGraph.append("svg:path").attr("d", line(data)).attr("class", "line");
    confidenceGraph.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
    confidenceGraph.append("text").attr("x", 235).attr("y", height + 40).style("text-anchor", "end").text("Confidence in frequency in BPM").attr("font-size", "12pt").attr("fill", "steelblue");
  }
}


//function startCapture(){
//  video.play();

//   // ** set the framerate and draw the video the canvas at the desired fps **
//     renderTimer = setInterval(function(){
//     context.drawImage(canvas, 0, 0, width, height);
//   }, Math.round(1000 / fps));
// //   dataSend = setInterval(function(){
// //     if (sendingData){
// //     sendData(JSON.stringify({"array": [red, green, blue], "bufferWindow": green.length}));
// //   }
// //
// // }, Math.round(1000));



          });
// controls for face tracker
//             var gui = new dat.GUI();
//             gui.add(tracker, 'edgesDensity', 0.1, 0.5).step(0.01);
//             gui.add(tracker, 'initialScale', 1.0, 10.0).step(0.1);
//             gui.add(tracker, 'stepSize', 1, 5).step(0.1);
//

};

// Activity log.
function log(message) {
  var logDiv = document.getElementById('log');
  logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
  logDiv.scrollTop = logDiv.scrollHeight;
}

// Leave Room.
function leaveRoomIfJoined() {
  if (activeRoom) {
    activeRoom.disconnect();
  }
}
