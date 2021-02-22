# nmp-player
Node Minecraft Protocol Video Player

# Description
This library allows you to display videos using the 'map' item in minecraft.
Currently supports:
- Video JSON's [*link*](#videoJSON)

# Contributing
Feel free to open an issue or a pull request! :D

API
===

**NMP-Player**
- VideoPlayer
- Video
- Converter

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

## Properties

### video.FPS
Number. The FPS of the video.

### video.playing
Boolean representing if the video is currently playing or not.

### video.data
An array of buffers that represent the frames.



---


# Class: Converter

## Static Methods

### Converter.extractFrames([options])
Extracts frames using ffmpeg.
- options: Object
- options.filename: Path to the video or name of the video. Default: _"./video.mp4"_
- options.ffmpegPath: Path to ffmpeg. Default: _"%FFMPEG_PATH%"_
- options.path: Name of the folder that you want to extract the frames to. Default: _"frames"_
Returns: Promise (resolves when ffmpeg finishes)

### Converter.convertFrames([path], [delete])
Converts frames from a folder. Use this after Converter.extractFrames()
**Note:** This method does not _save_ the converted frames. Look for the output.
- path: Folder of the frames. Default: _"frames"_
- delete: Deletes the converted frame or not. Default: _true_
Returns: Promise<Array<Buffer>>

### Converter.convertToMap(buffer)
Converts buffer to map data (resized to 128x128). I dont really know how to handle the output, check code?
This method just does resizeForMap and toMap.
- buffer: image
Returns: Promise<ArrayBuffer>

### Converter.toMap(buffer)
Converts buffer to map data.
**Warn:** Does not resize.
- buffer: image (pixels)
Returns: Promise<ArrayBuffer>

### Converter.resizeForMap(buffer[, width][, height])
Resizes the image. (128x128)
- buffer: image (pixels)
- width: number (Default 128)
- height: number (Default 128)
Returns: Promise<Buffer>




---


# Function: downloadYoutube(URL, [filename])
Downloads a video.
- URL: Video URL
- filename: Name of the file to save to. Default: _"./video.mp4"_
Returns: EventEmitter
	- Events:
	- "progress" (percentage)
	- "finish" (filename)

# Function: convertYoutube(URL)
Downloads, extracts and converts the frames, then saves the video as _"video.json"_
- URL: Video URL
Returns: Promise<"video.json">

---


# Source
Either
- File path of a video json
- A video json
- An array of hex-encoded buffer strings