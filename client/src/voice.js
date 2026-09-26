// voice.js -- handle voice commands and lyric/singing recognition
import { skipSong } from './spotify.js';
import { getAccessToken, refreshAccessToken } from './auth.js';

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognitionAPI();
recognition.continuous = true;
recognition.lang = "ko"; // this will have to change based on song eventually ; FIXME
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const diagnostic = document.querySelector(".output");
const bg = document.querySelector("html");
const startBtn = document.querySelector("button");

recognition.start();

/*
recognition.onspeechend = () => {
  recognition.stop();
};
*/

recognition.onresult = (event) => {
  const command = event.results[0][0].transcript;
  
  if (command.includes() === "다음 곡") {
    skipSong(getAccessToken());
  }

};