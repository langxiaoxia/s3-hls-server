const { S3Client, ListObjectsCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const config = {
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};
const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const KEY_FORMAT = '/xx.ts';
const PRESIGNED_URL_EXPIRES = 600; // seconds
const MAX_TIME_SPAN = 3600; // seconds
const MIN_ITEM_IN_PLAYLIST = 3;
const MAX_ITEM_IN_PLAYLIST = 6;
const TS_CLIP_DURATION = 3; // seconds

const s3Client = new S3Client(config);

function getSeq(key) {
  const parts = key.split('/');
  if (parts.length != 7) {
    console.warn('invalid key!');
    return 0;
  }
  const year = parts[1];
  const month = parts[2];
  const date = parts[3];
  const hours = parts[4];
  const minutes = parts[5];
  const seconds = parts[6].substr(0, 2);
  let t = new Date(year, month, date, hours, minutes, seconds);
  return Math.trunc(t.getTime() / 3000);
}

// Get signed url for a key.
async function getUrl(key) {
  const input = {
    Bucket: BUCKET_NAME,
    Key: key,
  };
  const command = new GetObjectCommand(input);

  let url = "";
  try {
    url = await getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_URL_EXPIRES });
  } catch (err) {
    console.log("Error", err);
  }
  return url;
}

// Get all keys for a specific prefix.
async function getKeys(prefix) {
  // console.debug('prefix: ' + prefix);
  const input = {
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  };
  const command = new ListObjectsCommand(input);

  let keys = [];
  try {
    let result = await s3Client.send(command);
    if (result.Contents) {
      for (let item of result.Contents) {
        // console.debug(item.Key);
        keys.push(item.Key);
      }
    }
  } catch (err) {
    console.log("Error", err);
  }
  return keys;
}

// Get keys between start and end in second.
async function getMinuteKeys(cameraId, startTime, endTime) {
  let keys = [];

  if (startTime.getFullYear() != endTime.getFullYear()
    || startTime.getMonth() != endTime.getMonth()
    || startTime.getDate() != endTime.getDate()
    || startTime.getHours() != endTime.getHours()
    || startTime.getMinutes() != endTime.getMinutes()
    || startTime.getSeconds() > endTime.getSeconds()) {
    console.warn('invalid start or end!');
    return keys;
  }

  // get YYYY-MM-DDThh:mm
  let prefix = buildPrefix(cameraId, startTime.toISOString().substr(0, 16));
  let cur_keys = await getKeys(prefix);
  for (let key of cur_keys) {
    if (key.length == (prefix.length + KEY_FORMAT.length)) {
      // extract xx second from prefix/xx.ts
      const sec = Number(key.substr(key.length - 5, 2));
      if ((sec + TS_CLIP_DURATION) >= startTime.getSeconds() && sec <= endTime.getSeconds()) {
        keys.push(key);
      }
    } else {
      console.warn('bad key: ' + key);
    }
  }
  return keys;
}

// ISO String : YYYY-MM-DDThh:mm:ss.SSSZ
function buildPrefix(cameraId, isoStr) {
  let prefix = cameraId;

  // use only YYYY-MM-DDThh:mm:ss at most.
  if (isoStr.length > 19) {
    isoStr = isoStr.substr(0, 19);
  }

  // format sep char.
  isoStr = isoStr.replace('T', '/');
  isoStr = isoStr.replaceAll('-', '/');
  isoStr = isoStr.replaceAll(':', '/');

  // split into parts and concat as a prefix.
  const parts = isoStr.split('/');
  for (i = 0; i < parts.length; i++) {
    prefix = prefix.concat('/', parts[i]);
  }
  return prefix;
}

// build prefix between start and end in minute.
function buildPrefixs(cameraId, startTime, endTime) {
  let prefixs = [];
  while (endTime.getTime() >= startTime.getTime()) {
    // console.debug('loop start: ' + startTime);
    // get YYYY-MM-DDThh:mm
    let prefix = buildPrefix(cameraId, startTime.toISOString().substr(0, 16));
    prefixs.push(prefix);
    startTime.setMinutes(startTime.getMinutes() + 1);
  }
  return prefixs;
}

async function getKeysLatest(cameraId, nowTime) {
  const startTime = new Date(nowTime);
  startTime.setSeconds(startTime.getSeconds() - MAX_ITEM_IN_PLAYLIST * TS_CLIP_DURATION);
  const endTime = new Date(nowTime);
  let keys = await getKeysBetween(cameraId, startTime, endTime);
  return keys;
}

async function getKeysBetween(cameraId, startTime, endTime) {
  let keys = [];

  console.debug('start: ' + startTime);
  console.debug('end: ' + endTime);
  if (startTime.getTime() > endTime.getTime()) {
    console.warn('start more than end!');
    return keys;
  }

  if ((endTime.getTime() - startTime.getTime()) > MAX_TIME_SPAN * 1000) {
    console.warn('time span too large!');
    return keys;
  }

  if (startTime.getFullYear() == endTime.getFullYear()
    && startTime.getMonth() == endTime.getMonth()
    && startTime.getDate() == endTime.getDate()
    && startTime.getHours() == endTime.getHours()
    && startTime.getMinutes() == endTime.getMinutes()) {
    console.debug('[1] time span in same minute');
    keys = await getMinuteKeys(cameraId, startTime, endTime);
    return keys;
  }

  let startTimeTail = new Date(startTime);
  startTimeTail.setSeconds(59);
  console.debug('start tail: ' + startTimeTail);
  let start_keys = await getMinuteKeys(cameraId, startTime, startTimeTail);
  // console.debug('start keys: ' + start_keys);

  let endTimeHead = new Date(endTime);
  endTimeHead.setSeconds(0);
  console.debug('end head: ' + endTimeHead);
  let end_keys = await getMinuteKeys(cameraId, endTimeHead, endTime);
  // console.debug('end keys: ' + end_keys);

  if ((endTime.getTime() - startTime.getTime()) < 120 * 1000) {
    console.debug('[2] time span less than two minutes');
    if (start_keys.length > 0) {
      keys.push.apply(keys, start_keys);
    }
    if (end_keys.length > 0) {
      keys.push.apply(keys, end_keys);
    }
    return keys;
  }

  console.debug('[3] time span more than two minutes');
  if (start_keys.length > 0) {
    keys.push.apply(keys, start_keys);
  }

  let nextStartTime = new Date(startTime);
  nextStartTime.setMinutes(nextStartTime.getMinutes() + 1);
  console.debug('next start: ' + nextStartTime);

  let prevEndTime = new Date(endTime);
  prevEndTime.setMinutes(prevEndTime.getMinutes() - 1);
  console.debug('prev end: ' + prevEndTime);

  const prefixs = buildPrefixs(cameraId, nextStartTime, prevEndTime);
  for (let prefix of prefixs) {
    const mid_keys = await getKeys(prefix);
    // console.debug('mid keys: ' + mid_keys);
    if (mid_keys.length > 0) {
      keys.push.apply(keys, mid_keys);
    }
  }

  if (end_keys.length > 0) {
    keys.push.apply(keys, end_keys);
  }
  return keys;
}

module.exports = {
  TS_CLIP_DURATION,
  getSeq,
  getUrl,
  getKeysLatest,
  getKeysBetween,
}
