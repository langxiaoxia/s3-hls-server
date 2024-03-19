const { httpServer } = require('./http_server');
const { getLivelist, getReplaylist } = require('./m3u8');

const host = '0.0.0.0';
const port = 8081;
const camera_id = process.env.AWS_S3_PREFIX;

let liveButton = document.getElementById('live-button');
let nowTimeCtrl = document.getElementById('now-time');

let replayButton1 = document.getElementById('replay-button-1');
let startTimeCtrl1 = document.getElementById('start-time-1');
let endTimeCtrl1 = document.getElementById('end-time-1');

let replayButton2 = document.getElementById('replay-button-2');
let startTimeCtrl2 = document.getElementById('start-time-2');
let endTimeCtrl2 = document.getElementById('end-time-2');

let replayButton3 = document.getElementById('replay-button-3');
let startTimeCtrl3 = document.getElementById('start-time-3');
let endTimeCtrl3 = document.getElementById('end-time-3');

// for datetime-local control
const toISOStringWithTimezone = date => {
  const tzOffset = -date.getTimezoneOffset();
  const diff = tzOffset >= 0 ? '+' : '-';
  const pad = n => `${Math.floor(Math.abs(n))}`.padStart(2, '0');
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    diff + pad(tzOffset / 60) +
    ':' + pad(tzOffset % 60);
}

liveButton.onclick = async function () {
  let nowTime = new Date();
  let nowStr = toISOStringWithTimezone(nowTime);
  nowTimeCtrl.value = nowStr.substr(0, 19);
  let m3u8 = await getLivelist(camera_id, nowTime);
  console.debug('live m3u8: ' + m3u8);

  var video = document.getElementById('my_video');
  var videoSrc = 'https://localhost:8081/live.m3u8?camera_id=demo';
  //
  // First check for native browser HLS support
  //
  // if (video.canPlayType('application/vnd.apple.mpegurl')) {
  if (video.canPlayType('application/x-mpegURL')) {
    console.log('native browser HLS is supported!');
    video.src = videoSrc;
    //
    // If no native HLS support, check if HLS.js is supported
    //
  } else if (Hls.isSupported()) {
    console.log('HLS.js is supported!');
    var hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);
  } else {
    console.log('neither native browser HLS nor HLS.js is supported!');
  }
}

replayButton1.onclick = async function () {
  let startTime = new Date(startTimeCtrl1.value);
  let endTime = new Date(endTimeCtrl1.value);
  let m3u8 = await getReplaylist(camera_id, startTime, endTime);
  console.debug('replay1 m3u8: ' + m3u8);
}

replayButton2.onclick = async function () {
  let startTime = new Date(startTimeCtrl2.value);
  let endTime = new Date(endTimeCtrl2.value);
  let m3u8 = await getReplaylist(camera_id, startTime, endTime);
  console.debug('replay2 m3u8: ' + m3u8);
}

replayButton3.onclick = async function () {
  let startTime = new Date(startTimeCtrl3.value);
  let endTime = new Date(endTimeCtrl3.value);
  let m3u8 = await getReplaylist(camera_id, startTime, endTime);
  console.debug('replay3 m3u8: ' + m3u8);
}

console.debug('server listening...');
httpServer.listen(port, host, () => {
  // (0) live
  let nowTime = new Date();
  let nowStr = toISOStringWithTimezone(nowTime);
  nowTimeCtrl.value = nowStr.substr(0, 19);

  // (1) in same minute
  let startTime1 = new Date('2024-03-11 14:04:00');
  let endTime1 = new Date('2024-03-11 14:04:59');
  let startStr1 = toISOStringWithTimezone(startTime1);
  startTimeCtrl1.value = startStr1.substr(0, 19);
  let endStr1 = toISOStringWithTimezone(endTime1);
  endTimeCtrl1.value = endStr1.substr(0, 19);

  // (2) not in same minute and less than two minutes.
  let startTime2 = new Date('2024-03-11 14:04:00');
  let endTime2 = new Date('2024-03-11 14:05:59');
  let startStr2 = toISOStringWithTimezone(startTime2);
  startTimeCtrl2.value = startStr2.substr(0, 19);
  let endStr2 = toISOStringWithTimezone(endTime2);
  endTimeCtrl2.value = endStr2.substr(0, 19);

  // (3) 2 min <= ts <= 10 min
  let startTime3 = new Date('2024-03-11 14:04:00');
  let endTime3 = new Date('2024-03-11 14:12:59');
  let startStr3 = toISOStringWithTimezone(startTime3);
  startTimeCtrl3.value = startStr3.substr(0, 19);
  let endStr3 = toISOStringWithTimezone(endTime3);
  endTimeCtrl3.value = endStr3.substr(0, 19);

  console.log(`[${nowStr}] Server running at https://${host}:${port}/`);
});
