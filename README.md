# nmp-player
Node Minecraft Protocol Media Player

# Description
Play .nbs music and mp4 etc videos inside minecraft using minecraft-protocol or anything of your choice

# Contributing
Feel free to open an issue or a pull request! :D

Install
=======

Available on npm
```npm install nmp-player```

TODO
====

If you can do any of these and have free time to do so, you are free to open a PR :3
- Probably a subtitle player (needs xml parsing i think)
- Propose a json/file structure for medias
- Stream mode for VideoPlayer



# API

**module.exports**
- MediaPlayer
- VideoPlayer
- SongPlayer
- VideoProcessor
- DisplayList
- MapData

## new nmp.MediaPlayer()
Abstract class containing basic methods. You can use this to make your own media players.

Extends **EventEmitter**

### player.setVolume(number: v)
Set the volume

### player.setFrameRate(number: fps)
Set the framerate (FPS, frames per second)

### player.setSpeed(number: speed)
Set the playback speed. Default is `1`

### player.progress
Returns a percentage (0 to 100) of the player's progress. Is always `100` is `player.isStream` is `true`

### player.duration
Get the duration of the media in milliseconds

### player.play([boolean: fromStart])
Play or resume, if `fromStart` is `true`, plays the media from the beginning, otherwise resumes if paused

### player.pause()
Pause the media

### player.stop()
Stops playing and rewinds to the start

### player.seekTo(number: f)
### player.seek(number: f)
### player.forward(number: f)
### player.rewind(number: f)
seekTo, seek, rewind or forward the playback.
 * f : the frame count

### player.seekToSeconds(number: s)
### player.seekSeconds(number: s)
### player.forwardSeconds(number: s)
### player.rewindSeconds(number: s)
seekTo, seek, rewind or forward the playback.
 * s : amount in seconds

### player.loop : boolean
If true, loops when the player ends playing

### event `loopRestart`
The media started playing again because loop is on

### event `end`
The media ended

### event `started`
### event `stop`
### event `paused`
speaks for itself

### event `forceStop`
Forcefully stopped, one reason why is `player.play(true)`

## Stream mode
Stream mode is a mode where the playback excepts frames to be ready.

### player.isStream : boolean
If `true`, the player is in stream mode. If `false`, it isnt.

### player.addFrame(frame)
Add the frame, calling this in non-stream mode might have side effects

### player.addBulkFrames(frame[])
player.addFrame but in bulk

### event `buffering`
Emitted when the player starts to wait for input, aka use this to show a loading icon idk

### event `bufferingEnd`
Emitted when buffering ends


## new nmp.VideoPlayer() extends MediaPlayer

All methods in MediaPlayer are present
- Stream mode is not supported




Update Logs
-----------

## 1.0.2

- Added SongPlayer
- Server is now optional for VideoPlayer
- Added the ability to add custom frame display functions to VideoPlayer

## 1.0.1
- Changed Converter class function names to be more understandable