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
	Finished: "finished",
};

class VideoProcessor extends EventEmitter {
	constructor(player){
		super();
		this.player = player;
		this.state = States.Idle;
		this.ffmpeg = null;
	};
	async process(src){
		this.startFFMPEG(src);
		await this.waitForFFMPEGEnd();
	};
	startFFMPEG(src){
		if(!src) throw new Error("Video Source Stream is not defined!");
		this.state = States.Working;
		this.ffmpeg = spawn(FFMPEG_PATH, [
			"-i", "-",                         // input from stdin
			"-c:v", "png",                     // export as pngs
			"-r", this.player?.frameRate ?? 1, // fps
			"-preset", "ultrafast",            // does this even help
			"-hide_banner",                    // aka no stdout info
			"-f", "image2pipe",                // use mp4=>png conversion
			"-"                                // stdout output
		]);
		let splitter = new StreamSplitter(PNGHEADER);
		splitter.on("data", (pngData) => this.handlePNG(Buffer.concat([PNGHEADER, pngData])))
		src.pipe(this.ffmpeg.stdin);
		this.ffmpeg.stdout.pipe(splitter);
		
		this.ffmpeg.on("close", (code, sig) => {
			this.state = States.Finished;
		});
		this.ffmpeg.on("error", (e) => this.emit("ffmpegError", e));
	};
	async waitForFFMPEGEnd(){
		return await once(this.ffmpeg, "close");
	};
	async handlePNG(pngData){
		const { data, info } = await sharp(pngData)
			.resize({
				width: 128 * this.player?.displays?.width,
				height: 128 * this.player?.displays?.height,
				fit: 'contain'
			})
			.removeAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		const numXSections = Math.ceil(info.width / 128);
		const numYSections = Math.ceil(info.height / 128);

		//console.info('Frame', info);
		//console.info('Number of sections X (Width)', numXSections);
		//console.info('Number of sections Y (Height)', numYSections);

		let displays = {};

		// thanks, @IceTank
		for (let sX = 0; sX < numXSections; sX++) { // Width
			for (let sY = 0; sY < numYSections; sY++) { // Height
				
				// for every section:
				let chunk = [];
				for (let dx = 0; dx < 128; dx++) { // X
					for (let dz = 0; dz < 128; dz++) { // Z
						let x = sX * 128 + dx;
						let z = sY * 128 + dz;
						if (x > info.width || z > info.height) {
							continue;
						};

						let i = (x + (z * info.width)) * 3;
						let r = data[i];
						let g = data[i + 1];
						let b = data[i + 2];
						chunk.push(convertColor(r, g, b));
					};
				};
				displays[this.player?.displays.ids[sX + (sY * numXSections)]] = Buffer.from(chunk);
				//
			};
		};
		
		this.emit("frame", displays);
	};
	dispose(){
		if(this.ffmpeg) {
			try {
				this.ffmpeg.kill();
			} catch(e){};
			this.ffmpeg = null;
		};
	};
	static async process(player, src){
		let startTime = Date.now();
		let processor = new VideoProcessor(player);
		let listener = (frame) => {
			player.frames.push(frame);
		};
		processor.on("frame", listener);
		await processor.process(src);
		processor.off("frame", listener);
		processor.dispose();
		return {
			timeTaken: Date.now() - startTime,
		};
	};
};

module.exports = VideoProcessor;