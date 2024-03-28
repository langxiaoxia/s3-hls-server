const { TS_CLIP_DURATION, getSeq, getUrl, getKeysLatest, getKeysBetween } = require('./s3_client');

async function getLivePlaylist(cameraId, nowTime) {
  let playhead = '#EXTM3U\r\n';

  let keys = await getKeysLatest(cameraId, nowTime);
  if (keys.length < 1) {
    console.log(`invalid count: ${keys.length}`);
    return playhead;
  }

  const first_seq = await getSeq(keys[0]);
  if (first_seq < 0) {
    console.log(`invalid SEQUENCE: ${first_seq}`);
    return playhead;
  }

  playhead += '#EXT-X-TARGETDURATION:' + TS_CLIP_DURATION + '\r\n';
  playhead += "#EXT-X-VERSION:1\r\n";
  playhead += '#EXT-X-MEDIA-SEQUENCE:' + first_seq + '\r\n';
  let playlist = playhead;

  let last_seq = -1;
  let last_key;
  for (let key of keys) {
    const seq = await getSeq(key);
    if (seq < 0) {
      console.log(`invalid element: seq=${seq}, key=${key}`);
      playlist = playhead;
      break;
    }
    if (last_seq >= 0) {
      if (seq <= last_seq) {
        console.log(`invalid DISCONTINUITY between [${last_seq}, ${seq}]`);
        playlist = playhead;
        break;
      }
      for (let d = last_seq + 1; d < seq; d++) {
        console.log(`DISCONTINUITY [${d}] between [${last_seq}, ${seq}]`);
        playlist += "#EXT-X-DISCONTINUITY\r\n";
      }
    }
    last_seq = seq;
    last_key = key;

    const url = await getUrl(key);
    playlist += '#EXTINF:' + TS_CLIP_DURATION + ',\r\n';
    playlist += url + '\r\n';
  }

  return playlist;
}

async function getVoDPlaylist(cameraId, startTime, endTime) {
  let playhead = '#EXTM3U\r\n';
  playhead += "#EXT-X-PLAYLIST-TYPE:VOD\r\n";

  let keys = await getKeysBetween(cameraId, startTime, endTime);
  if (keys.length < 1) {
    console.log(`invalid count: ${keys.length}`);
    return playhead;
  }

  playhead += '#EXT-X-TARGETDURATION:' + TS_CLIP_DURATION + '\r\n';
  playhead += "#EXT-X-VERSION:1\r\n";
  playhead += "#EXT-X-MEDIA-SEQUENCE:0\r\n";
  let playlist = playhead;

  for (let key of keys) {
    const url = await getUrl(key);
    playlist += '#EXTINF:' + TS_CLIP_DURATION + ',\r\n';
    playlist += url + '\r\n';
  }

  playlist += '#EXT-X-ENDLIST\r\n';
  return playlist;
}

module.exports = {
  getLivePlaylist,
  getVoDPlaylist
}
