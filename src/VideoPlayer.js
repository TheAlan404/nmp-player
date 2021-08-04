const ytdl = require("ytdl-core");
const fs = require("fs");
const { Worker } = require("worker_threads");
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
			cache: false,//todo // save bandwidth and stuff
		});
		this.displays = displays ?? new DisplayList(1, 1, [1]);
		this.isStream = opts.isStream ?? true;
		if(this.isStream) super.play();
	};
	async loadWorker(){
		if(this.worker) {
			await this.worker.terminate();
			this.worker = null;
		};
		this.worker = new Worker(__dirname + "/processing/Worker.js", {
			workerData: {
				displays: this.displays,
				frameRate: this.frameRate,
			},
		});
		this.worker.on("message", (data) => this.frames.push(data));
	};
	setDisplays(displays){
		if(!displays) throw new Error("displays is not specified");
		if(!isNaN(displays)) displays = new DisplayList(1, 1, [displays]);
		this.displays = displays;
		this.loadWorker();
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
		/* // how to make this compatible with the new worker stuff???
		if(this.source instanceof Canvas || this.source.getContext) {
			this.processor.setMode("canvas");
		} else {
			this.processor.setMode("video");
		};*/
		
		//this.processor.start(this.source);
		await this.loadWorker();
		this.worker.postMessage(["video", this.source]);
	};
	stop(...a){
		this.frames = [];
		this.worker.postMessage(["CLEAR"]);
		super.stop(...a);
	};
	processFrame(frame){
		// implement it yourself smh
	};
};

module.exports = VideoPlayer;