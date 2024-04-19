const { httpServer, port, host, append_num } = require('./http_server');
const { getLivePlaylist, getVoDPlaylist, getEventPlaylist } = require('./m3u8');

const camera_id = process.env.AWS_S3_PREFIX;

let liveButton = document.getElementById('live-button');

let vodButton = document.getElementById('vod-button');
let vodStartTimeCtrl = document.getElementById('vod-start-time');
let vodEndTimeCtrl = document.getElementById('vod-end-time');

let eventButton = document.getElementById('event-button');
let eventStartTimeCtrl = document.getElementById('event-start-time');
let eventEndTimeCtrl = document.getElementById('event-end-time');

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

function playVideo(url) {
  console.log(url);
  let video = document.getElementById('my_video');
  video.pause();
  video.src = null;

  //
  // First check for native browser HLS support
  //
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    console.log('native browser HLS is supported!');
    video.src = url;
    video.addEventListener('canplay', function () {
      video.muted = true;
      video.play();
    });
  //
  // If no native HLS support, check if HLS.js is supported
  //
  } else if (Hls.isSupported()) {
    console.log('HLS.js is supported!');
    self.hls = new Hls({
      debug: true,
    });
    self.hls.loadSource(url);
    self.hls.attachMedia(video);
    self.hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      video.muted = true;
      video.play();
    });
  } else {
    console.log('neither native browser HLS nor HLS.js is supported!');
  }
}

liveButton.onclick = async function () {
  const nowTime = new Date();
  const playlist = await getLivePlaylist(camera_id, nowTime, -1);
  console.debug(playlist.m3u8);

  const url = `https://localhost:${port}/live.m3u8?camera_id=${camera_id}`;
  playVideo(url);
}

vodButton.onclick = async function () {
  const startTime = new Date(vodStartTimeCtrl.value);
  const endTime = new Date(vodEndTimeCtrl.value);
  const playlist = await getVoDPlaylist(camera_id, startTime, endTime);
  console.debug(playlist.m3u8);

  const startStr = startTime.toISOString().substr(0, 19).replace('T', ' ');
  const endStr = endTime.toISOString().substr(0, 19).replace('T', ' ');
  const url = `https://localhost:${port}/vod.m3u8?camera_id=${camera_id}&start=${startStr}&end=${endStr}`;
  playVideo(url);
}

eventButton.onclick = async function () {
  const startTime = new Date(eventStartTimeCtrl.value);
  const endTime = new Date(eventEndTimeCtrl.value);
  const playlist = await getEventPlaylist(camera_id, startTime, endTime, null, -1, append_num);
  console.debug(playlist.m3u8);

  const startStr = startTime.toISOString().substr(0, 19).replace('T', ' ');
  const endStr = endTime.toISOString().substr(0, 19).replace('T', ' ');
  const url = `https://localhost:${port}/event.m3u8?camera_id=${camera_id}&start=${startStr}&end=${endStr}`;
  playVideo(url);
}

// console.debug(`[${process.pid}] server starting...`);
httpServer.listen(port, host, () => {
  const nowTime = new Date();
  console.log(`[${process.pid}] [${nowTime.toISOString()}] Server running at https://${host}:${port}/`);

  const startTime = new Date(nowTime.getTime() - 600 * 1000);
  const endTime = new Date(nowTime);
  const startStr = toISOStringWithTimezone(startTime);
  const endStr = toISOStringWithTimezone(endTime);

  // VOD
  vodStartTimeCtrl.value = startStr.substr(0, 19);
  vodEndTimeCtrl.value = endStr.substr(0, 19);

  // EVENT
  eventStartTimeCtrl.value = startStr.substr(0, 19);
  eventEndTimeCtrl.value = endStr.substr(0, 19);
});
// console.debug(`[${process.pid}] server started`);
