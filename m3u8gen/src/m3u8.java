public class m3u8 {
    public static String GetLiveList(String[] urls, String duration, String seq) {
        String playlist;
        if (urls.length == 0) {
          playlist = "#EXTM3U\r\n";
          playlist += "#EXT-X-TARGETDURATION:" + duration + "\r\n";
          return playlist;
        }

        playlist = "#EXTM3U\r\n";
        playlist += "#EXT-X-TARGETDURATION:" + duration + "\r\n";
        playlist += "#EXT-X-MEDIA-SEQUENCE:" + seq + "\r\n";

        for (int i = 0; i < urls.length; i++) {
          String url = urls[i];
          playlist += "#EXTINF:" + duration + ",\r\n";
          playlist += url + "\r\n";
        }

        return playlist;
    }

    public static String GetReplayList(String[] urls, String duration) {
      String playlist;
      if (urls.length == 0) {
        playlist = "#EXTM3U\r\n";
        playlist += "#EXT-X-TARGETDURATION:" + duration + "\r\n";
        playlist += "#EXT-X-PLAYLIST-TYPE:VOD\r\n";
        playlist += "#EXT-X-ENDLIST\r\n";
        return playlist;
      }

      playlist = "#EXTM3U\r\n";
      playlist += "#EXT-X-TARGETDURATION:" + duration + "\r\n";
      playlist += "#EXT-X-PLAYLIST-TYPE:VOD\r\n";

      for (int i = 0; i < urls.length; i++) {
        String url = urls[i];
        playlist += "#EXTINF:" + duration + ",\r\n";
        playlist += url + "\r\n";
      }

      playlist += "#EXT-X-ENDLIST\r\n";
      return playlist;
  }
}
