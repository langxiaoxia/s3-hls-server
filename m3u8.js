const { TS_CLIP_DURATION, getSeq, getUrl, getKeysLatest, getKeysBetween } = require('./s3_client');
const java = require("java");
var m3u8 = java.import("m3u8");

async function getLivelist(cameraId, nowTime) {
  let keys = await getKeysLatest(cameraId, nowTime);
  let seq = 0;
  if (keys.length > 0) {
    seq = getSeq(keys[0]);
  }
  let urls = [];
  for (let key of keys) {
    const url = await getUrl(key);
    urls.push(url);
  }
  var playlist = m3u8.GetLivePlayListSync(urls, TS_CLIP_DURATION.toString(), seq.toString());
  return playlist;
}

async function getReplaylist(cameraId, startTime, endTime) {
  let keys = await getKeysBetween(cameraId, startTime, endTime);
  let urls = [];
  for (let key of keys) {
    const url = await getUrl(key);
    urls.push(url);
  }
  var playlist = m3u8.GetReplayListSync(urls, TS_CLIP_DURATION.toString());
  return playlist;
}

module.exports = {
  getLivelist,
  getReplaylist
}
