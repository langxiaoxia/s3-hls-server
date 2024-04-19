const { TS_CLIP_DURATION, getSeq, getUrl, getKeysLatest, getKeysBetween } = require('./s3_client');

async function getLivePlaylist(cameraId, nowTime, lastSeq) {
  let keys = await getKeysLatest(cameraId, nowTime);
  if (keys.length < 1) {
    console.log(`invalid count: ${keys.length}`);
    return {m3u8: null, seq: -1};
  }

  const first_seq = await getSeq(keys[0]);
  if (first_seq < 0) {
    console.log(`invalid SEQUENCE: ${first_seq}`);
    return {m3u8: null, seq: -1};
  }

  let playlist = '#EXTM3U\r\n';
  playlist += "#EXT-X-VERSION:1\r\n";
  playlist += '#EXT-X-TARGETDURATION:' + TS_CLIP_DURATION + '\r\n';
  playlist += '#EXT-X-MEDIA-SEQUENCE:' + first_seq + '\r\n';

  let last_seq = -1;
  let last_key;
  for (let key of keys) {
    const seq = await getSeq(key);
    if (seq < 0) {
      console.log(`invalid element: seq=${seq}, key=${key}`);
      return {m3u8: null, seq: -1};
    }

    if (last_seq >= 0) {
      if (seq <= last_seq) {
        console.log(`invalid DISCONTINUITY between [${last_seq}, ${seq}]`);
        return {m3u8: null, seq: -1};
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

  return {m3u8: playlist, seq: first_seq};
}

async function getVoDPlaylist(cameraId, startTime, endTime) {
  let keys = await getKeysBetween(cameraId, startTime, endTime);
  if (keys.length < 1) {
    console.log(`invalid count: ${keys.length}`);
    return {m3u8: null, seq: -1};
  }

  const first_seq = await getSeq(keys[0]);
  if (first_seq < 0) {
    console.log(`invalid SEQUENCE: ${first_seq}`);
    return {m3u8: null, seq: -1};
  }

  let playlist = '#EXTM3U\r\n';
  playlist += "#EXT-X-VERSION:1\r\n";
  playlist += "#EXT-X-PLAYLIST-TYPE:VOD\r\n";
  playlist += '#EXT-X-TARGETDURATION:' + TS_CLIP_DURATION + '\r\n';
  playlist += '#EXT-X-MEDIA-SEQUENCE:' + first_seq + '\r\n';

  for (let key of keys) {
    const url = await getUrl(key);
    playlist += '#EXTINF:' + TS_CLIP_DURATION + ',\r\n';
    playlist += url + '\r\n';
  }

  playlist += '#EXT-X-ENDLIST\r\n';
  return {m3u8: playlist, seq: first_seq};
}

async function getEventPlaylist(cameraId, startTime, endTime, lastM3U8, lastSeq, appendNum) {
  let keys = await getKeysBetween(cameraId, startTime, endTime);
  if (keys.length < 1) {
    console.log(`invalid count: ${keys.length}`);
    return {m3u8: null, seq: -1};
  }

  const first_seq = await getSeq(keys[0]);
  if (first_seq < 0) {
    console.log(`invalid SEQUENCE: ${first_seq}`);
    return {m3u8: null, seq: -1};
  }

  let playlist;
  if (lastM3U8) {
    playlist = lastM3U8;
  } else {
    playlist = '#EXTM3U\r\n';
    playlist += "#EXT-X-VERSION:1\r\n";
    playlist += "#EXT-X-PLAYLIST-TYPE:EVENT\r\n";
    playlist += '#EXT-X-TARGETDURATION:' + TS_CLIP_DURATION + '\r\n';
    playlist += '#EXT-X-MEDIA-SEQUENCE:' + first_seq + '\r\n';
  }

  var last_seq = -1;
  var total = 0;
  var count = 0;
  for (let key of keys) {
    last_seq = await getSeq(key);
    if (last_seq < 0) {
      console.log(`invalid SEQUENCE: ${last_seq}`);
      return {m3u8: null, seq: -1};
    }

    total++;
    if (last_seq <= lastSeq) {
      continue;
    }

    const url = await getUrl(key);
    playlist += '#EXTINF:' + TS_CLIP_DURATION + ',\r\n';
    playlist += url + '\r\n';

    count++;
    if (count >= appendNum) {
      break;
    }
  }

  if (last_seq < lastSeq) {
    console.log(`incomplete playlist: ${last_seq} < ${lastSeq}`);
    return {m3u8: null, seq: -1};
  }

  if (total == keys.length && last_seq != lastSeq) {
    playlist += '#EXT-X-ENDLIST\r\n';
  }
  return {m3u8: playlist, seq: last_seq};
}

module.exports = {
  getLivePlaylist,
  getVoDPlaylist,
  getEventPlaylist
}
