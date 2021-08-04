const { spawn } = require("child_process");
const { EventEmitter, once } = require("events");
const { convertColor } = require("./MapData");
const sharp = require("sharp");
const StreamSplitter = require("stream-split");

const PNGHEADER = Buffer.from("89504E470D0A1A0A", "hex");

let FFMPEG_PATH = "ffmpeg";
try {
	FFMPEG_PATH = require("ffmpeg-static");
} catch(e) {};

const States = {
	Idle: "idle",
	Working: "working",
};

const Modes = {
	None: "none",
	Canvas: "canvas",
	Video: "video",
};

function getConverter(type = "canvas"){
	switch(type) {
		case "canvas":
			return require("./processing/CanvasProcessor");
			break;
		case "sharp":
			return require("./processing/SharpProcessor");
			break;
		default:
			throw new Error("Unsupported processor type: "+type);
	};
};

class VideoProcessor extends EventEmitter {
	constructor(displays, opts = {}){
		super();
		this.displays = displays;
		this.frameRate = opts.frameRate;
		this.state = States.Idle;
		this.type = opts.type ?? "canvas";
		this.ffmpeg = null;
		this.canvas = null;
		this.mode = Modes.None;
	};
	setMode(mode){
		this.mode = mode;
	};
	start(data){
		switch(this.mode){
			case Modes.None:
				return;
			case Modes.Video:
				this.startFFMPEG(data);
				break;
			case Modes.Canvas:
				this.startCanvas(data);
				break;
		};
	};
	startCanvas(canvas){
		if(canvas) this.canvas = canvas;
		if(!this.canvas) throw new Error("Canvas is not present");
		if(this.mode !== Modes.Canvas) throw new Error("Must be in canvas mode");
		if(this.interval || this.state === States.Working) throw new Error("Already started");
		
		this.state = States.Working;
		let { convert } = getConverter(this.type);
		let displays = this.displays;
		let ctx = this.canvas.getContext("2d");
		this.interval = setInterval(async () => {
			this.emit("frame", await convert(ctx, displays));
		}, this.frameRate);
	};
	startFFMPEG(src){
		if(!src) throw new Error("Video Source Stream is not defined!");
		if(this.mode !== Modes.Video) throw new Error("FFMPEG can only be used in video mode!");
		if(this.ffmpeg || this.state === States.Working) throw new Error("Another video is already being processed! Call clear() to kill ffmpeg");
		this.state = States.Working;
		this.ffmpeg = spawn(FFMPEG_PATH, [
			"-i", "-",                         // input from stdin
			"-c:v", "png",                     // export as pngs
			"-r", this.frameRate ?? 1, // fps
			"-preset", "ultrafast",            // does this even help
			//"-hwaccel",                        // go nyoom if possible
			"-hide_banner",                    // aka no stdout info
			"-f", "image2pipe",                // use mp4=>png conversion
			"-"                                // stdout output
		]);
		let splitter = new StreamSplitter(PNGHEADER);
		src.pipe(this.ffmpeg.stdin);
		this.ffmpeg.stdout.pipe(splitter);
		this.ffmpeg.on("close", (code, sig) => {
			this.state = States.Idle;
			this.ffmpeg = null;
		});
		this.ffmpeg.on("error", (e) => this.emit("ffmpegError", e));
		let displays = this.displays;
		let { process } = getConverter(this.type);
		splitter.on("data", async (pngData) => {
			this.emit("frame", await process(Buffer.concat([PNGHEADER, pngData]), displays));
		});
	};
	clear(){
		if(this.ffmpeg) {
			try {
				this.ffmpeg.kill();
			} catch(e){};
			this.ffmpeg = null;
		};
		if(this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		};
		if(this.canvas) {
			this.canvas = null;
		};
	};
};

module.exports = VideoProcessor;