const { TS_CLIP_DURATION, getSeq, getUrl, getKeysLatest, getKeysBetween } = require('./s3_client');
const java = require("java");
var m3u8 = java.import("m3u8");

async function getLivePlaylist(cameraId, nowTime) {
  let keys = await getKeysLatest(cameraId, nowTime);
  let seqs = [];
  let infs = [];
  let urls = [];
  for (let key of keys) {
    const seq = await getSeq(key);
    seqs.push(seq);
    infs.push(TS_CLIP_DURATION); //TODO : use real duration of the clip.
    const url = await getUrl(key);
    urls.push(url);
  }
  // contain an empty object if no key.
  if (keys.length < 1) {
    seqs = [-1];
    infs = [0];
    urls = [""];
  }

  // get live m3u8 by jar.
  var playlist = m3u8.GetLivePlaylistSync(keys.length, seqs, infs, urls, TS_CLIP_DURATION);
  return playlist;
}

async function getVoDPlaylist(cameraId, startTime, endTime) {
  let keys = await getKeysBetween(cameraId, startTime, endTime);
  let infs = [];
  let urls = [];
  for (let key of keys) {
    infs.push(TS_CLIP_DURATION); //TODO : use real duration of the clip.
    const url = await getUrl(key);
    urls.push(url);
  }
  // contain an empty object if no key.
  if (keys.length < 1) {
    infs = [0];
    urls = [""];
  }

  // get vod m3u8 by jar.
  var playlist = m3u8.GetVoDPlaylistSync(keys.length, infs, urls, TS_CLIP_DURATION);
  return playlist;
}

module.exports = {
  getLivePlaylist,
  getVoDPlaylist
}
