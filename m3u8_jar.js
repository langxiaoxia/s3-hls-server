const { TS_CLIP_DURATION, getSeq, getUrl, getKeysLatest, getKeysBetween } = require('./s3_client');


// To use Jar in Node.js:
// (1) Load node-java bridge.
const java = require("java");

// (2) Set Java class path which include the jar file.
java.classpath.push('./m3u8gen/m3u8gen.jar');

// (3) Load Java class.
const m3u8_jar = java.import("com.grandstream.gdms.gds.M3u8gen");


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

  let seqs = [];
  let infs = [];
  let urls = [];
  for (let key of keys) {
    const seq = await getSeq(key);
    if (seq < 0) {
      console.log(`invalid element: seq=${seq}, key=${key}`);
      return {m3u8: null, seq: -1};
    }

    seqs.push(seq);
    infs.push(TS_CLIP_DURATION); //TODO : use real duration of the clip.
    const url = await getUrl(key);
    urls.push(url);
  }

  // get live m3u8 by jar.
  try {
    var playlist = m3u8_jar.GetLivePlaylistSync(TS_CLIP_DURATION, keys.length, seqs, infs, urls);
    if (playlist == "") {
      return {m3u8: null, seq: -1};
    }

    return {m3u8: playlist, seq: first_seq};
  } catch (error) {
    console.error('GetLivePlaylist by jar exception:', error);
    return {m3u8: null, seq: -1};
  }
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

  let infs = [];
  let urls = [];
  for (let key of keys) {
    infs.push(TS_CLIP_DURATION); //TODO : use real duration of the clip.
    const url = await getUrl(key);
    urls.push(url);
  }

  // get vod m3u8 by jar.
  try {
    var playlist = m3u8_jar.GetVoDPlaylistSync(TS_CLIP_DURATION, first_seq, keys.length, infs, urls);
    if (playlist == "") {
      return {m3u8: null, seq: -1};
    }

    return {m3u8: playlist, seq: first_seq};
  } catch (error) {
    console.error('GetVoDPlaylist by jar exception:', error);
    return {m3u8: null, seq: -1};
  }
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

  let infs = [];
  let urls = [];
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

    infs.push(TS_CLIP_DURATION); //TODO : use real duration of the clip.
    const url = await getUrl(key);
    urls.push(url);

    count++;
    if (count >= appendNum) {
      break;
    }
  }

  if (last_seq < lastSeq) {
    console.log(`incomplete playlist: ${last_seq} < ${lastSeq}`);
    return {m3u8: null, seq: -1};
  }

  // idempotent for the last playlist.
  if (total == keys.length && last_seq == lastSeq) {
    console.log('idempotent for the last playlist');
    return {m3u8: lastM3U8, seq: lastSeq};
  }

  // get event m3u8 by jar.
  var head = (lastM3U8 == null);
  var end = (total == keys.length);
  try {
    var playlist = m3u8_jar.GetEventPlaylistSync(TS_CLIP_DURATION, first_seq, count, infs, urls, head, end);
    if (playlist == "") {
      return {m3u8: null, seq: -1};
    }

    if (lastM3U8) {
      playlist = lastM3U8 + playlist;
    }
    return {m3u8: playlist, seq: last_seq};
  } catch (error) {
    console.error('GetEventPlaylist by jar exception:', error);
    return {m3u8: null, seq: -1};
  }
}


module.exports = {
  getLivePlaylist,
  getVoDPlaylist,
  getEventPlaylist
}
