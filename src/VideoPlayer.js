const ytdl = require("ytdl-core");
const fs = require("fs");
const { Canvas } = require("canvas");
const MediaPlayer = require("./MediaPlayer");
const DisplayList = require("./DisplayList");
const VideoProcessor = require("./VideoProcessor");
const States = {
	...MediaPlayer.States,
	Processing: "processing",
};

class VideoPlayer extends MediaPlayer {
	constructor(displays, opts = {}){
		super({
			...opts,
			cache: true, // save bandwidth and stuff
		});
		this.displays = displays ?? new DisplayList(1, 1, [1]);
		this.processor = new VideoProcessor();
		this.processor.on("frame", (data) => this.frames.push(data));
		this.isStream = opts.isStream ?? true;
	};
	setDisplays(displays){
		if(!displays) throw new Error("displays is not specified");
		if(!isNaN(displays)) displays = new DisplayList(1, 1, [displays]);
		this.displays = displays;
	};
	async load(src){
		if(typeof src === "string") {
			let isYT = (() => {
				try {
					ytdl.getVideoID(src);
					return true;
				} catch(e) {
					return false;
				};
			})();
			
			if(isYT) {
				this.source = ytdl(src);
				return;
			} else {
				if(fs.existsSync(src)) return fs.createReadStream(src);
				throw new Error("Unsupported source:", src);
			};
		} else {
			this.source = src;
		}
	};
	async play(src){
		if(src) await this.load(src);
		if(!this.source) throw new Error("No video specified!");
		
		if(this.source instanceof Canvas || this.source.getContext) {
			this.processor.setMode("canvas");
		} else {
			this.processor.setMode("video");
		};
		
		this.processor.start(this.source);
		
		super.play();
	};
	stop(...a){
		this.processor.clear();
		super.stop(...a);
	};
	processFrame(frame){
		// implement it yourself smh
	};
};

module.exports = VideoPlayer;