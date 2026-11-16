import type {FilmMedia} from './films';
// Measured, content-addressed film assets. See docs/films/OPENING_SHORT.md.
export const VIDEO_ASSETS:Record<string,FilmMedia>={
  "opening": {
    "id": "opening",
    "src": "/video/opening-h3-2k.d562332a46c3.mp4",
    "poster": "/video/opening-h3-2k.d562332a46c3.webp",
    "duration": 23,
    "width": 2560,
    "height": 1440,
    "fps": 24,
    "hasAudio": true,
    "sha256": "d562332a46c3bffb90a90561385e0362133875633280f388a3c50a367164198f",
    "sourceType": "generated-scene-motion",
    "provider": "MiniMax H3 native 2K; local Qwen3-TTS original narration and rain compositing",
    "captionPlacement": "gutter",
    "captions": [
      {
        "start": 0.25,
        "end": 4.85,
        "text": "澄港，初秋。今晚，书屋还亮着灯。"
      },
      {
        "start": 5.25,
        "end": 9.85,
        "text": "白天，你在印刷厂校书，攒下了十二万元。"
      },
      {
        "start": 10.25,
        "end": 14.8,
        "text": "程姨准备去南方住一阵。"
      },
      {
        "start": 15.25,
        "end": 19.8,
        "text": "她留下一封信，还有书屋三年的租约。"
      }
    ],
    "stream": {
      "src": "/video/opening-h3-720p.fa4e07aaef99.mp4",
      "poster": "/video/opening-h3-720p.fa4e07aaef99.webp",
      "width": 1280,
      "height": 720,
      "sha256": "fa4e07aaef9983c08908a86f3a291bd876bf004c62e7b9b34b68f6ade5608dcd"
    }
  }
};
