# nmp-player
Node Minecraft Protocol Video Player

# WARNING
**This library is WIP!!**

# Description
This library allows you to display videos using the 'map' item in minecraft.
Currently supports:
- Video JSON's [*link*](#videoJSON)

API
===

**NMP-Player**
- VideoPlayer
- Video

# Class: VideoPlayer(server, [options]) extends EventEmitter
A video player. Args:
- Server: minecraft-protocol server.
- Options: Object

## Properties

### videoplayer.loaded
The loaded video. Is [Video](#Video) or null.

### videoplayer.ID
A number. Represents the ID of the video player. Used for sending map packets.
Default: 0

## Functions

### videoplayer.giveMaps([options])
Gives a map with the video player's ID to all the players in the server.
- options: Object
- options.slot: The slot to give the item to. Defaults to 36.

### videoplayer.load(src)
Loads a video.
- src: [A source](#Source)
Returns: Promise<Video>

### videoplayer.play([resource])
Plays the loaded video, loads the resource if given first.
- resource: [A source](#Source)
Returns: Promise<Video> (resolves after video stops playing)

## Events

### "finished" (video)
Fires when a video is finished.
- video: [Video](#Video)

### "play" (video)
Fires when a video starts playing.
- video: [Video](#Video)

### "frame" (video, buffer, frameNo)
Fires every frame in a video.
- video: [Video](#Video)
- buffer: Buffer data of the frame.
- frameNo: Number of the frame



---



# Class: Video
Used internally. You should not generally initialize this class yourself. Either way, constructor:
- videoplayer: [VideoPlayer](#VideoPlayer)
- data: Video Data (An array of hex-encoded buffer strings)
- meta: Object containing metadata of the video.

## video.FPS
Number. The FPS of the video.

## video.playing
Boolean representing if the video is currently playing or not.

## video.data
An array of buffers that represent the frames.



---



# Source
Either
- File path of a video json
- A video json
- An array of hex-encoded buffer strings