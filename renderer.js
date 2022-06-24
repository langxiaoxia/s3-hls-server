const { httpServer } = require('./http_server');
const { getKeysLatest, getKeysBetween } = require('./s3_client');

const host = 'localhost';
const port = 8080;

const camera_id = 'demo';

let liveButton = document.getElementById('live-button');
let nowTimeCtrl = document.getElementById('now-time');

let replayButton = document.getElementById('replay-button');
let startTimeCtrl = document.getElementById('start-time');
let endTimeCtrl = document.getElementById('end-time');

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

liveButton.onclick = async function() {
    let nowTime = new Date(nowTimeCtrl.value);
    console.log('live now: ' + nowTime);

    let keys = await getKeysLatest(camera_id, nowTime);
    console.log(keys);
}

replayButton.onclick = async function() {
    let startTime = new Date(startTimeCtrl.value);
    console.log('replay start: ' + startTime);

    let endTime = new Date(endTimeCtrl.value);
    console.log('replay end: ' + endTime);

    let keys = await getKeysBetween(camera_id, startTime, endTime);
    console.log(keys);
}

httpServer.listen(port, host, () => {
    let nowTime = new Date();
    let nowStr = toISOStringWithTimezone(nowTime);
    nowTimeCtrl.value = nowStr.substr(0, 19);

    // (1) in same minute
    // let startTime = new Date('2022-06-23 19:15:20');
    // let endTime = new Date('2022-06-23 19:15:50');

    // (2) not in same minute and less than two minutes.
    // let startTime = new Date('2022-06-23 19:15:20');
    // let endTime = new Date('2022-06-23 19:16:10');

    // (3) 2 min <= ts <= 10 min
    let startTime = new Date('2022-06-23 19:15:20');
    let endTime = new Date('2022-06-23 19:22:20');

    let startStr = toISOStringWithTimezone(startTime);
    startTimeCtrl.value = startStr.substr(0, 19);
    let endStr = toISOStringWithTimezone(endTime);
    endTimeCtrl.value = endStr.substr(0, 19);

    console.log(`[${nowTime.toISOString()}] Server running at http://${host}:${port}/`);
});
