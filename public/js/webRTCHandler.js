import * as wss from "./wss.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";
import * as store from "./store.js";

let connectedUserDetails;
let peerConnection;
let dataChannel;
let turnServers = [];

export const setTURNServers = (servers) => {
  turnServers = servers;
};

const defaultConstraints = {
  audio: true,
  video: true,
};

export const getLocalPreview = () => {
  navigator.mediaDevices
    .getUserMedia(defaultConstraints)
    .then((stream) => {
      console.log("Local preview stream obtained");
      ui.updateLocalVideo(stream);
      ui.showVideoCallButtons();
      store.setCallState(constants.callState.CALL_AVAILABLE);
      store.setLocalStream(stream);
    })
    .catch((err) => {
      console.error("Error accessing camera:", err);
    });
};

const createPeerConnection = () => {
  const configuration = {
    iceServers: [...turnServers, { url: "stun:stun1.l.google.com" }],
    iceTransportPolicy: 'relay'
  };

  peerConnection = new RTCPeerConnection(configuration);

  dataChannel = peerConnection.createDataChannel("chat");

  peerConnection.ondatachannel = (event) => {
    const dataChannel = event.channel;

    dataChannel.onopen = () => {
      console.log("Data channel is open and ready to use");
    };

    dataChannel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      ui.appendMessage(message);
    };
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignaling.ICE_CANDIDATE,
        candidate: event.candidate,
      });
    }
  };

  peerConnection.onconnectionstatechange = (event) => {
    console.log("Connection state changed:", peerConnection.connectionState);
  };

  const remoteStream = new MediaStream();
  store.setRemoteStream(remoteStream);
  ui.updateRemoteVideo(remoteStream);

  peerConnection.ontrack = (event) => {
    remoteStream.addTrack(event.track);
  };

  if (
    connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE ||
    connectedUserDetails.callType === constants.callType.VIDEO_STRANGER
  ) {
    const localStream = store.getState().localStream;
    for (const track of localStream.getTracks()) {
      peerConnection.addTrack(track, localStream);
    }
  }
};

export const sendMessageUsingDataChannel = (message) => {
  if (dataChannel && dataChannel.readyState === "open") {
    const stringifiedMessage = JSON.stringify(message);
    dataChannel.send(stringifiedMessage);
  } else {
    console.log("Data channel is not open");
  }
};

export const sendPreOffer = (callType, calleePersonalCode) => {
  connectedUserDetails = {
    callType,
    socketId: calleePersonalCode,
  };

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const data = {
      callType,
      calleePersonalCode,
    };
    console.log("Sending pre-offer for personal code");
    ui.showCallingDialog(callingDialogRejectCallHandler);
    store.setCallState(constants.callState.CALL_UNAVAILABLE);
    wss.sendPreOffer(data);
  }

  if (
    callType === constants.callType.CHAT_STRANGER ||
    callType === constants.callType.VIDEO_STRANGER
  ) {
    const data = {
      callType,
      calleePersonalCode,
    };
    console.log("Sending pre-offer for stranger");
    store.setCallState(constants.callState.CALL_UNAVAILABLE);
    wss.sendPreOffer(data);
  }
};

export const handlePreOffer = (data) => {
  const { callType, callerSocketId } = data;

  if (!checkCallPossibility()) {
    console.log("Call possibility check failed");
    return sendPreOfferAnswer(
      constants.preOfferAnswer.CALL_UNAVAILABLE,
      callerSocketId
    );
  }

  connectedUserDetails = {
    socketId: callerSocketId,
    callType,
  };

  store.setCallState(constants.callState.CALL_UNAVAILABLE);

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler);
  }

  if (
    callType === constants.callType.CHAT_STRANGER ||
    callType === constants.callType.VIDEO_STRANGER
  ) {
    console.log("Creating peer connection for stranger");
    createPeerConnection();
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
    ui.showCallElements(connectedUserDetails.callType);
    ui.showVideoContainer(); // Ensure this is called after call is accepted
  }
};

const acceptCallHandler = () => {
  console.log("Call accepted");
  createPeerConnection();
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
  ui.showCallElements(connectedUserDetails.callType);
  ui.showVideoContainer(); // Ensure this is called after call is accepted
};

const rejectCallHandler = () => {
  console.log("Call rejected");
  sendPreOfferAnswer();
  setIncomingCallsAvailable();
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
};

const callingDialogRejectCallHandler = () => {
  console.log("Calling dialog reject handler invoked");
  const data = {
    connectedUserSocketId: connectedUserDetails.socketId,
  };
  closePeerConnectionAndResetState();
  wss.sendUserHangedUp(data);
};

const sendPreOfferAnswer = (preOfferAnswer, callerSocketId = null) => {
  const socketId = callerSocketId
    ? callerSocketId
    : connectedUserDetails.socketId;
  const data = {
    callerSocketId: socketId,
    preOfferAnswer,
  };
  ui.removeAllDialogs();
  wss.sendPreOfferAnswer(data);
};

export const handlePreOfferAnswer = (data) => {
  const { preOfferAnswer } = data;
  ui.removeAllDialogs();

  if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
    ui.showInfoDialog(preOfferAnswer);
    setIncomingCallsAvailable();
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
    setIncomingCallsAvailable();
    ui.showInfoDialog(preOfferAnswer);
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
    setIncomingCallsAvailable();
    ui.showInfoDialog(preOfferAnswer);
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
    console.log("Call accepted by callee");
    ui.showCallElements(connectedUserDetails.callType);
    createPeerConnection();
    sendWebRTCOffer();
    ui.showVideoContainer(); // Ensure this is called here
  }
};

const sendWebRTCOffer = async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log("Sending WebRTC offer");
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.OFFER,
    offer: offer,
  });
};

export const handleWebRTCOffer = async (data) => {
  await peerConnection.setRemoteDescription(data.offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log("Sending WebRTC answer");
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.ANSWER,
    answer: answer,
  });
};

export const handleWebRTCAnswer = async (data) => {
  await peerConnection.setRemoteDescription(data.answer);
};

export const handleWebRTCCandidate = async (data) => {
  try {
    await peerConnection.addIceCandidate(data.candidate);
  } catch (err) {
    console.error("Error adding received ICE candidate", err);
  }
};

let screenSharingStream;

export const switchBetweenCameraAndScreenSharing = async (
  screenSharingActive
) => {
  if (screenSharingActive) {
    const localStream = store.getState().localStream;
    const senders = peerConnection.getSenders();

    const sender = senders.find((sender) => {
      return sender.track.kind === localStream.getVideoTracks()[0].kind;
    });

    if (sender) {
      sender.replaceTrack(localStream.getVideoTracks()[0]);
    }

    store.getState().screenSharingStream.getTracks().forEach((track) => track.stop());

    store.setScreenSharingActive(!screenSharingActive);

    ui.updateLocalVideo(localStream);
  } else {
    try {
      screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      store.setScreenSharingStream(screenSharingStream);

      const senders = peerConnection.getSenders();

      const sender = senders.find((sender) => {
        return sender.track.kind === screenSharingStream.getVideoTracks()[0].kind;
      });

      if (sender) {
        sender.replaceTrack(screenSharingStream.getVideoTracks()[0]);
      }

      store.setScreenSharingActive(!screenSharingActive);

      ui.updateLocalVideo(screenSharingStream);
    } catch (err) {
      console.error("Error getting screen sharing stream", err);
    }
  }
};

export const handleHangUp = () => {
  const data = {
    connectedUserSocketId: connectedUserDetails.socketId,
  };

  wss.sendUserHangedUp(data);
  closePeerConnectionAndResetState();

  // Reset UI after hang-up
  ui.resetToInitialView();
};

export const handleConnectedUserHangedUp = () => {
  closePeerConnectionAndResetState();

  // Reset UI after hang-up
  ui.resetToInitialView();
};

const closePeerConnectionAndResetState = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (
    connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE ||
    connectedUserDetails.callType === constants.callType.VIDEO_STRANGER
  ) {
    store.getState().localStream.getVideoTracks()[0].enabled = true;
    store.getState().localStream.getAudioTracks()[0].enabled = true;
  }

  ui.updateUIAfterHangUp(connectedUserDetails.callType);
  setIncomingCallsAvailable();
  connectedUserDetails = null;
};

const checkCallPossibility = (callType) => {
  const callState = store.getState().callState;

  if (callState === constants.callState.CALL_AVAILABLE) {
    return true;
  }

  if (
    (callType === constants.callType.VIDEO_PERSONAL_CODE ||
      callType === constants.callType.VIDEO_STRANGER) &&
    callState === constants.callState.CALL_AVAILABLE_ONLY_CHAT
  ) {
    return false;
  }

  return false;
};

const setIncomingCallsAvailable = () => {
  const localStream = store.getState().localStream;
  if (localStream) {
    store.setCallState(constants.callState.CALL_AVAILABLE);
  } else {
    store.setCallState(constants.callState.CALL_AVAILABLE_ONLY_CHAT);
  }
};
