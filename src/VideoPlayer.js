const ytdl = require("ytdl-core");
const fs = require("fs");
const MediaPlayer = require("./MediaPlayer");
const DisplayList = require("./DisplayList");
const VideoProcessor = require("./VideoProcessor");
const States = {
	...MediaPlayer.States,
	Processing: "processing",
};

class VideoPlayer extends MediaPlayer {
	constructor(displays, opts){
		super(opts);
		this.displays = displays ?? new DisplayList(1, 1, [1]);
		this.stream = null;
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
				this.stream = ytdl(src);
				return;
			} else {
				if(fs.existsSync(src)) return fs.createReadStream(src);
				throw new Error("Unsupported source:", src);
			};
		} else if(src && src.on) {
			this.stream = src; // very good idea to check if it is a stream like this. -den
		} else {
			throw new Error("Unsupported source:", src);
		};
	};
	async play(src){
		if(src) await this.load(src);
		if(!this.stream) throw new Error("No video specified!");
		
		let meta = await VideoProcessor.process(this, this.stream);
		console.log("Processing took", meta.timeTaken, "ms!");
		
		super.play();
	};
	processFrame(frame){
		// implement it yourself smh
	};
};

module.exports = VideoPlayer;