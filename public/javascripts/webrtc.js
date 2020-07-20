function createPeerConnection() {
    myPeerConnection = new RTCPeerConnection({
      iceServers : app.$data.iceServers
    });

    myPeerConnection.onicecandidate = handleICECandidateEvent;
    myPeerConnection.ontrack = handleTrackEvent;
    myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
    myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
    myPeerConnection.onconnectionstatechange = handleconnectionstatechange;
  }
  async function handleVideoOfferMsg(msg) {
    console.log(msg);
    var localStream = null;
    
    createPeerConnection();

    var desc = new RTCSessionDescription(msg.sdp);

    myPeerConnection.setRemoteDescription(desc).then(function () {
      return navigator.mediaDevices.getUserMedia(mediaConstraints);
    })
    .then(function(stream) {
        myStream = stream;
      localStream = stream;
      document.getElementById("local_video").srcObject = localStream;

      localStream.getTracks().forEach(track => myPeerConnection.addTrack(track, localStream));
    })
    .then(function() {
      return myPeerConnection.createAnswer();
    })
    .then(function(answer) {
      return myPeerConnection.setLocalDescription(answer);
    })
    .then(function() {
      var msg = {
        name: socket.id,
        target: app.$data.targetUserName,
        nickName: app.$data.nickName,
        type: "video-answer",
        sdp: myPeerConnection.localDescription
      };

      socket.emit('receiveCall', msg)
    })
    .catch(handleGetUserMediaError);
  }


  function handleNegotiationNeededEvent() {
    myPeerConnection.createOffer().then(function(offer) {
      return myPeerConnection.setLocalDescription(offer);
    })
    .then(function() {
      socket.emit('call', {
        name: socket.id,
        target: app.$data.targetUserName,
        nickName: app.$data.nickName,
        type: "video-offer",
        sdp: myPeerConnection.localDescription
      });
    })
    .catch((s) => {
      console.log(s);
    });
  }
  function handleICECandidateEvent(event){
    if (event.candidate) {
    console.log(event);
    socket.emit('ice', {
      type: "new-ice-candidate",
      target: app.$data.targetUserName,
      nickName: app.$data.nickName,
      candidate: event.candidate
    });
}

  }
  function handleTrackEvent(event){
    document.getElementById("received_video").srcObject = event.streams[0];
    // document.getElementById("hangup-button").disabled = false
  }
  function handleRemoveTrackEvent(){
    var stream = document.getElementById("received_video").srcObject;
    var trackList = stream.getTracks();
  
    if (trackList.length == 0) {
      closeVideoCall();
    }
  }
  function handleICEConnectionStateChangeEvent(){
    switch(myPeerConnection.iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        closeVideoCall();
        break;
    }
  }
  function handleICEGatheringStateChangeEvent(){

  }
  function handleSignalingStateChangeEvent(){
    switch(myPeerConnection.signalingState) {
      case "closed":
        closeVideoCall();
        break;
    }
  }
  function handleNewICECandidateMsg(msg) {
    console.log()
    var candidate = new RTCIceCandidate(msg.candidate);

    myPeerConnection.addIceCandidate(candidate)
      .catch((reportError) => {
        console.log(reportError)
      });
  }
  

  function closeVideoCall() {
    var remoteVideo = document.getElementById("received_video");
    var localVideo = document.getElementById("local_video");

    if (myPeerConnection) {
      myPeerConnection.ontrack = null;
      myPeerConnection.onremovetrack = null;
      myPeerConnection.onremovestream = null;
      myPeerConnection.onicecandidate = null;
      myPeerConnection.oniceconnectionstatechange = null;
      myPeerConnection.onsignalingstatechange = null;
      myPeerConnection.onicegatheringstatechange = null;
      myPeerConnection.onnegotiationneeded = null;

      if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      }

      if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
      }

      myPeerConnection.close();
      myPeerConnection = null;
    }

    remoteVideo.removeAttribute("src");
    remoteVideo.removeAttribute("srcObject");
    localVideo.removeAttribute("src");
    remoteVideo.removeAttribute("srcObject");

    // document.getElementById("hangup-button").disabled = true;
    targetUsername = null;
  }

  function handleVideoAnswerMessage(msg) {
    
    var desc = new RTCSessionDescription(msg.sdp);
    
    myPeerConnection.setRemoteDescription(desc);
  }
  function handleGetUserMediaError(e) {
    switch(e.name) {
      case "NotFoundError":
        alert("Unable to open your call because no camera and/or microphone" +
              "were found.");
        break;
      case "SecurityError":
      case "PermissionDeniedError":
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        alert("Error opening your camera and/or microphone: " + e.message);
        break;
    }

    closeVideoCall();
  }
  function handleconnectionstatechange(ev){
    switch(myPeerConnection.connectionState) {
      case "new":
      case "checking":
        console.log("Connecting...");
        break;
      case "connected":
        console.log("Online");
        break;
      case "disconnected":
        console.log("Disconnecting...");
        break;
      case "closed":
        console.log("Offline");
        break;
      case "failed":
        console.log("Error");
        break;
      default:
        console.log("Unknown");
        break;
    }
  }
  