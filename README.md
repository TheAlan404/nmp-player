# nmp-player
Node Minecraft Protocol Video Player

# Description
This library allows you to display videos using the 'map' item in minecraft.
Currently supports:
- Video JSON's [*link*](#videoJSON)

# Contributing
Feel free to open an issue or a pull request! :D

Install
=======

Available on npm
```npm install nmp-player```


TODO
====

These must be done, if you can do it and have free time your free to open a PR :3
- Move play methods to VideoPlayer from Video, like SongPlayer
- Add MediaPlayer which will be able to play both video and songs (maybe add in subtitles to the mix)
- Propose a json/file structure for medias
- Add streams for ffmpeg and youtube streams
- Make a Builder class for better media converting



API
====

**NMP-Player**
- VideoPlayer
- Video
- Converter

# Class: VideoPlayer([server], [options]) extends EventEmitter
A video player. Extends EventEmitter. Args:
- Server: minecraft-protocol server.
- Options: Object
- options.ID: number
- options.frame: function, if given will call with buffer data to display frames

## Example

```js
const { VideoPlayer } = require('nmp-player')

<...>

videoplayer = new VideoPlayer(server)

videoplayer.play('./video.json')

videoplayer.on('play', (video) => console.log() )
```

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


# Class: SongPlayer([server])
A song player. Plays .nbs files, using [nbs.js](https://github.com/TheAlan404/nbs.js).
Server is optional, but you should write your own \_note method. Extends EventEmitter.

## Example

```js
const { SongPlayer } = require('nmp-player')

<...>

songplayer = new SongPlayer()

songplayer._note = function(packet){
	packet.x = 0
	packet.y = 0
	packet.z = 0
	client.write('sound_effect', packet)
}

songplayer.play('./song.nbs')
```

## Properties

### songplayer.song
The loaded [Song](https://github.com/TheAlan404/nbs.js)

### songplayer.tick
The current tick

### songplayer.interval
The interval of the song player

### songplayer.playing
Boolean representing if a song is playing

## Functions

### songplayer.load(src)
Try to load src, can be:
- Song
- String (filename)

### songplayer.play([src])
Plays song. src is same as load()

### songplayer._note(packet)
Handles notes, you must set this to your own function.
- The packet name is 'sound_effect'
- You must give x, y, z to the packet, calculate this by multiplying the players coordinate by 8.

### songplayer.stop()
Stops playing song

## Events

### "play" (song)
Fires when a song starts playing.
- song: [Song](https://github.com/TheAlan404/nbs.js)

### "stop"
Fires when the songplayer is manually stopped.

### "end"
Fires when song ends.

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

### video.meta
An object for video metadata.
If the video is loaded from a file, it can contain 'filename'


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


# Class: PixelTransformer
A Transform stream that converts given png chunks into minecraft map pixel data.
You need to make the chunks complete pngs, you can do this using [stream-split](https://www.npmjs.com/package/stream-split)
**Note:** This only converts PNG's to pixel data, it does not resize it into 128x128 dimensions

## Event: videoShape (shape)
Emits only once, gives you the dimensions of the video/frame/png's you have given
shape is an array, **[x, y]**

## Property: videoShape
Same as the event but is set when the videoShape event is emitted


**Example**

```js
	const { spawn } = require("child_process")
	

	let ffmpegProcess = spawn("C:\\ffmpeg\\bin\\ffmpeg.exe", ["-i", "pipe:0", "-r", fps, "-hide_banner", "-c:v", "png", "-f", "image2pipe", "-"])
	videoFileStream.pipe(ffmpegProcess.stdin)
	let splitter = new Split(Buffer.from(PNGHEAD, "hex"))
	let frameDataStream = ffmpegProcess.stdout.pipe(splitter)
	let pixelStream = new NMP.PixelTransformer()
	frameDataStream.pipe(pixelStream)
	
	pixelStream.pipe(<...>)
	// or
	pixelStream.on("data", (data) => { <...> })
```


---


# Object: mapPixels

Contains
- mapPixels.pixels,
- mapPixels.COLORS,
- mapPixels.fromImage,
- mapPixels.hex,
- mapPixels.color,
- mapPixels.nearestMatch

See [mapPixels.js](/mapPixels.js) for more info

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

---

Update Logs
-----------

## 1.0.2

- Added SongPlayer
- Server is now optional for VideoPlayer
- Added the ability to add custom frame display functions to VideoPlayer

## 1.0.1
- Changed Converter class function names to be more understandable