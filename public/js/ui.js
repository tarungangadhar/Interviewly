import * as constants from "./constants.js";
import * as elements from "./elements.js";

export const updatePersonalCode = (personalCode) => {
  const personalCodeParagraph = document.getElementById(
    "personal_code_paragraph"
  );
  personalCodeParagraph.innerHTML = personalCode;
};

export const updateLocalVideo = (stream) => {
  const localVideo = document.getElementById("local_video");
  localVideo.srcObject = stream;

  localVideo.addEventListener("loadedmetadata", () => {
    localVideo.play();
  });
};

export const showVideoCallButtons = () => {
  const personalCodeVideoButton = document.getElementById(
    "personal_code_video_button"
  );
  const strangerVideoButton = document.getElementById("stranger_video_button");

  showElement(personalCodeVideoButton);
  showElement(strangerVideoButton);
};

export const updateRemoteVideo = (stream) => {
  const remoteVideo = document.getElementById("remote_video");
  remoteVideo.srcObject = stream;
};

export const showIncomingCallDialog = (
  callType,
  acceptCallHandler,
  rejectCallHandler
) => {
  const callTypeInfo =
    callType === constants.callType.CHAT_PERSONAL_CODE ? "Chat" : "Video";

  const incomingCallDialog = elements.getIncomingCallDialog(
    callTypeInfo,
    acceptCallHandler,
    rejectCallHandler
  );

  // removing all dialogs inside HTML dialog element
  const dialog = document.getElementById("dialog");
  dialog.querySelectorAll("*").forEach((dialog) => dialog.remove());

  dialog.appendChild(incomingCallDialog);
};

export const showCallingDialog = (rejectCallHandler) => {
  const callingDialog = elements.getCallingDialog(rejectCallHandler);

  // removing all dialogs inside HTML dialog element
  const dialog = document.getElementById("dialog");
  dialog.querySelectorAll("*").forEach((dialog) => dialog.remove());

  dialog.appendChild(callingDialog);
};

export const showNoStrangerAvailableDialog = () => {
  const infoDialog = elements.getInfoDialog(
    "No Stranger available",
    "Please try again later"
  );

  if (infoDialog) {
    const dialog = document.getElementById("dialog");
    dialog.appendChild(infoDialog);

    setTimeout(() => {
      removeAllDialogs();
    }, [4000]);
  }
};

export const showInfoDialog = (preOfferAnswer) => {
  let infoDialog = null;

  if (preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
    infoDialog = elements.getInfoDialog(
      "Call rejected",
      "Callee rejected your call"
    );
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
    infoDialog = elements.getInfoDialog(
      "Callee not found",
      "Please check personal code"
    );
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
    infoDialog = elements.getInfoDialog(
      "Call is not possible",
      "Probably callee is busy. Please try again later"
    );
  }

  if (infoDialog) {
    const dialog = document.getElementById("dialog");
    dialog.appendChild(infoDialog);

    setTimeout(() => {
      removeAllDialogs();
    }, [4000]);
  }
};

export const removeAllDialogs = () => {
  const dialog = document.getElementById("dialog");
  dialog.querySelectorAll("*").forEach((dialog) => dialog.remove());
};

export const showCallElements = (callType) => {
  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.CHAT_STRANGER
  ) {
    showChatCallElements();
  }

  if (
    callType === constants.callType.VIDEO_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_STRANGER
  ) {
    showVideoCallElements();
  }
};

const showChatCallElements = () => {
  const finishConnectionChatButtonContainer = document.getElementById(
    "finish_chat_button_container"
  );
  showElement(finishConnectionChatButtonContainer);

  const newMessageInput = document.getElementById("new_message");
  showElement(newMessageInput);
  //block panel
  disableDashboard();
};

const showVideoCallElements = () => {
  const callButtons = document.getElementById("call_buttons");
  showElement(callButtons);

  const placeholder = document.getElementById("video_placeholder");
  hideElement(placeholder);

  const remoteVideo = document.getElementById("remote_video");
  showElement(remoteVideo);

  const newMessageInput = document.getElementById("new_message");
  showElement(newMessageInput);
  //block panel
  disableDashboard();
};

// ui call buttons

const micOnImgSrc = "./utils/images/mic.png";
const micOffImgSrc = "./utils/images/micOff.png";

export const updateMicButton = (micActive) => {
  const micButtonImage = document.getElementById("mic_button_image");
  micButtonImage.src = micActive ? micOffImgSrc : micOnImgSrc;
};

const cameraOnImgSrc = "./utils/images/camera.png";
const cameraOffImgSrc = "./utils/images/cameraOff.png";

export const updateCameraButton = (cameraActive) => {
  const cameraButtonImage = document.getElementById("camera_button_image");
  cameraButtonImage.src = cameraActive ? cameraOffImgSrc : cameraOnImgSrc;
};

// ui messages
export const appendMessage = (message, right = false) => {
  const messagesContainer = document.getElementById("messages_container");
  const messageElement = right
    ? elements.getRightMessage(message)
    : elements.getLeftMessage(message);
  messagesContainer.appendChild(messageElement);
};

export const clearMessenger = () => {
  const messagesContainer = document.getElementById("messages_container");
  messagesContainer.querySelectorAll("*").forEach((n) => n.remove());
};

// recording
export const showRecordingPanel = () => {
  const recordingButtons = document.getElementById("video_recording_buttons");
  showElement(recordingButtons);

  // hide start recording button if it is active
  const startRecordingButton = document.getElementById(
    "start_recording_button"
  );
  hideElement(startRecordingButton);
};

export const resetRecordingButtons = () => {
  const startRecordingButton = document.getElementById(
    "start_recording_button"
  );
  const recordingButtons = document.getElementById("video_recording_buttons");

  hideElement(recordingButtons);
  showElement(startRecordingButton);
};

export const switchRecordingButtons = (switchForResumeButton = false) => {
  const resumeButton = document.getElementById("resume_recording_button");
  const pauseButton = document.getElementById("pause_recording_button");

  if (switchForResumeButton) {
    hideElement(pauseButton);
    showElement(resumeButton);
  } else {
    hideElement(resumeButton);
    showElement(pauseButton);
  }
};

// ui after hanged up
export const updateUIAfterHangUp = (callType) => {
  enableDashboard();

  // hide the call buttons
  if (
    callType === constants.callType.VIDEO_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_STRANGER
  ) {
    const callButtons = document.getElementById("call_buttons");
    hideElement(callButtons);
  } else {
    const chatCallButtons = document.getElementById(
      "finish_chat_button_container"
    );
    hideElement(chatCallButtons);
  }

  const newMessageInput = document.getElementById("new_message");
  hideElement(newMessageInput);
  clearMessenger();

  updateMicButton(false);
  updateCameraButton(false);

  //hide remote video and show placeholder
  const remoteVideo = document.getElementById("remote_video");
  hideElement(remoteVideo);

  const placeholder = document.getElementById("video_placeholder");
  showElement(placeholder);

  removeAllDialogs();
};

// changing status of checkbox
export const updateStrangerCheckbox = (allowConnections) => {
  const checkboxCheckImg = document.getElementById(
    "allow_strangers_checkbox_image"
  );

  allowConnections
    ? showElement(checkboxCheckImg)
    : hideElement(checkboxCheckImg);
};

// ui helper functions

const enableDashboard = () => {
  const dashboardBlocker = document.getElementById("dashboard_blur");
  if (!dashboardBlocker.classList.contains("display_none")) {
    dashboardBlocker.classList.add("display_none");
  }
};

const disableDashboard = () => {
  const dashboardBlocker = document.getElementById("dashboard_blur");
  if (dashboardBlocker.classList.contains("display_none")) {
    dashboardBlocker.classList.remove("display_none");
  }
};

const hideElement = (element) => {
  if (!element.classList.contains("display_none")) {
    element.classList.add("display_none");
  }
};

const showElement = (element) => {
  if (element.classList.contains("display_none")) {
    element.classList.remove("display_none");
  }
};

// Mobile view functions

export const initializeMobileView = () => {
  if (window.innerWidth <= 768) {
    const dashboardContainer = document.querySelector('.dashboard_container');
    const callContainer = document.querySelector('.call_container');
    const messengerContainer = document.querySelector('.messenger_container');
    
    // Ensure dashboard is shown initially
    dashboardContainer.style.display = 'block';

    // Hide call and messenger containers initially
    callContainer.classList.remove('active');
    messengerContainer.classList.remove('active');

    // Remove any existing small icons or check icons
    const smallIcon = document.querySelector('.small-icon');
    if (smallIcon) smallIcon.remove();

    const checkIcon = document.querySelector('.check-icon');
    if (checkIcon) checkIcon.remove();
  }
};

export const showVideoContainer = () => {
  if (window.innerWidth <= 768) {
    const callContainer = document.querySelector('.call_container');
    const dashboardContainer = document.querySelector('.dashboard_container');
    
    // Show video container and hide dashboard
    callContainer.classList.add('active');
    dashboardContainer.style.display = 'none';

    // Add small chat icon
    if (!document.querySelector('.small-icon')) {
      const smallIcon = document.createElement('div');
      smallIcon.classList.add('small-icon');

      const chatIcon = document.createElement('img');
      chatIcon.src = './utils/images/chat.png'; // Ensure you have a chat icon in this path
      smallIcon.appendChild(chatIcon);

      document.body.appendChild(smallIcon);
      smallIcon.addEventListener('click', showChatContainer);
    }
  }
};

export const showChatContainer = () => {
  if (window.innerWidth <= 768) {
    const callContainer = document.querySelector('.call_container');
    const messengerContainer = document.querySelector('.messenger_container');
    
    // Show messenger and hide video container
    callContainer.classList.remove('active');
    messengerContainer.classList.add('active');

    // Add check icon to switch back to video
    if (!document.querySelector('.check-icon')) {
      const checkIcon = document.createElement('div');
      checkIcon.classList.add('check-icon');

      const checkImg = document.createElement('img');
      checkImg.src = './utils/images/closeIcon.jpg'; // Ensure you have a check icon in this path
      checkIcon.appendChild(checkImg);

      document.body.appendChild(checkIcon);
      checkIcon.addEventListener('click', () => {
        messengerContainer.classList.remove('active');
        callContainer.classList.add('active');
        checkIcon.remove();
        showSmallChatIcon();
      });
    }
    
    // Remove small chat icon when messenger is shown
    const smallIcon = document.querySelector('.small-icon');
    if (smallIcon) smallIcon.remove();
  }
};

export const showSmallChatIcon = () => {
  if (window.innerWidth <= 768) {
    if (!document.querySelector('.small-icon')) {
      const smallIcon = document.createElement('div');
      smallIcon.classList.add('small-icon');

      const chatIcon = new Image(); // Use the Image object to preload the image
      chatIcon.src = './utils/images/chatSymbol.jpg'; // Ensure you have a chat icon in this path

      // Wait for the image to load before appending it
      chatIcon.onload = function() {
        smallIcon.appendChild(chatIcon);
        document.body.appendChild(smallIcon); // Append the icon after it is fully loaded
      };

      // If image fails to load, show "CHAT" text
      chatIcon.onerror = function() {
        const chatText = document.createElement('span');
        chatText.innerText = 'CHAT';
        chatText.style.color = 'black';
        chatText.style.fontSize = '16px';
        smallIcon.appendChild(chatText);
        document.body.appendChild(smallIcon); // Append the fallback text after handling the error
      };

      // Add the event listener for clicking the icon
      smallIcon.addEventListener('click', showChatContainer);
    }
  }
};
// Function to reset the UI to the initial view after hang-up
export const resetToInitialView = () => {
  if (window.innerWidth <= 768) {
    const dashboardContainer = document.querySelector('.dashboard_container');
    const callContainer = document.querySelector('.call_container');
    const messengerContainer = document.querySelector('.messenger_container');

    // Reset the view to show the dashboard container
    dashboardContainer.style.display = 'block';
    callContainer.classList.remove('active');
    messengerContainer.classList.remove('active');

    // Remove any icons that may still be present
    const smallIcon = document.querySelector('.small-icon');
    if (smallIcon) smallIcon.remove();

    const checkIcon = document.querySelector('.check-icon');
    if (checkIcon) checkIcon.remove();
  }
};
