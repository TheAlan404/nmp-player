const Item = require('prismarine-item')("1.12.2");
const YTDL = require("ytdl-core");
const sharp = require('sharp');
const mapPixels = require("./mapPixels.js");
const { EventEmitter, once } = require("events");
const { exec } = require("child_process");
const fs = require("fs");

function parseBuffers(array){
	if(array[0] === null) array.shift();
	if(array.length && Buffer.isBuffer(array[0])) return array;
	return array.map(f => Buffer.from(f, "hex"));
};

class VideoPlayer extends EventEmitter {
	constructor(server, options={}){
		super();
		if(!server) throw new Error("No server specified!");
		this.server = server;
		this.options = options;
		this.loaded = null;
		this.ID = options.ID || 0;
	};
	giveMaps(options={}){
		let item = Item.toNotch(new Item(358, 1));
		item.itemDamage = this.ID;
		for(let clientID in this.server.clients) {
			let client = this.server.clients[clientID];
			client.write("set_slot", {
				windowId: 0,
				slot: options.slot || 36,
				item: item
			});
		};
	};
	load(src){
		let self = this;
		return new Promise(function(resolve){
			if(Array.isArray(src)) {
				self.loaded = new Video(self, src, {});
				resolve(self.loaded);
			} else {
				if(typeof src == "string") {
					self._loadFile(src, resolve);
				};
				if(typeof src == "object") {
					let data = src.frames || src.data || [];
					let meta = src.metadata;
					self.loaded = new Video(self, data, meta);
					resolve(self.loaded);
				};
			};
		});
	};
	_loadFile(path, resolve){
		let buf = fs.readFileSync(path);
		let data = JSON.parse(buf);
		let meta = null;
		if(!Array.isArray(data)) {
			meta = data.metadata;
			data = data.frames || data.data || [];
		};
		this.loaded = new Video(this, data, meta);
		if(resolve) resolve(this.loaded);
	};
	play(resource){
		let self = this;
		return new Promise(function(resolve){
			if(resource) self.load(resource);
			if(!self.loaded) throw new Error("Unable to load resource or no resource was loaded");
			self.loaded.play().then(function(video){
				resolve(video);
			}).catch(function(error){
				throw error;
			});
		});
	};
	
	_frame(data){
		let packet = {
			itemDamage: this.ID,
			scale: 4,
			trackingPosition: false,
			icons: [],
			columns: -128,
			rows: -128,
			x: 0,
			y: 0,
			data: (Buffer.isBuffer(data) ? data : Buffer.from(data, "hex")),
		};
		for(let clientID in this.server.clients){
			let client = this.server.clients[clientID];
			client.write('map', packet);
		};
	};
	_progress(progress){
		if(this.options.progressBar == "xp"){
			let packet = {
				experienceBar: (progress || 0),
				level: 0,
				totalExperience: 0,
			};
			for(let clientID in this.server.clients){
				let client = this.server.clients[clientID];
				client.write('experience', packet);
			};
		} else if(this.options.progressBar == "bossbar"){
			// todo
		};
	};
};

class Video {
	/*
	 * Used internally.
	 *  player - parent Player class
	 *  data - Array of Buffers
	 *  meta - Object
	*/
	constructor(videoplayer, data, meta={}){
		this.VideoPlayer = videoplayer;
		this.data = parseBuffers(data || []);
		this.FPS = meta.FPS || 10;
		this.playing = false;
		this._interval = null;
		this._currentFrame = 0;
	};
	play(){
		let self = this;
		if(this.playing) return;
		this.VideoPlayer.emit("play", this);
		this.playing = true;
		return new Promise(function(resolve){
			self._interval = setInterval(self._frame, 1000/self.FPS, self, resolve);
		});
	};
	stop(){
		if(this.playing) {
			clearInterval(this._interval);
		};
	};
	_frame(self, resolve){ // i hate this -d
		let data = self.data[self._currentFrame];
		if(!data) {
			clearInterval(self._interval);
			self.VideoPlayer.emit("finish", self);
			resolve(self);
			return;
		};
		let progress = (self.data.length/(self.data.length/self._currentFrame))/self.data.length;
		self.VideoPlayer._progress(progress);
		self.VideoPlayer._frame(data);
		self.VideoPlayer.emit("frame", self, data, self._currentFrame);
		self._currentFrame += 1;
	};
};






class Converter {
	static async extractFrames(options={}){
		return await new Promise(function(resolve){
			let fn = options.filename || "./video.mp4";
			let ffpath = options.ffmpegPath || "%FFMPEG_PATH%";
			let framepath = options.path || "frames";
			let fps = options.fps || 10;
			
			if(!fs.existsSync(framepath)) fs.mkdirSync(framepath);
			
			let process = exec(ffpath+" -i "+fn+" -r "+fps+" -hide_banner "+framepath+"/frame_%d.png");
			process.on("exit", function(){
				resolve();
			});
		});
	};
	
	static async convertFrames(path="./frames", del=true){
		let filenames = fs.readdirSync(path);
		let frames = [];
		
		for await (var filename of filenames){
			let filedata = fs.readFileSync(path+"/"+filename);
			if(del) fs.unlinkSync(path+"/"+filename);
			let data = await Converter.convertToMap(filedata);
			let i = filename.split(".")[0].replace("frame_", "");
			frames[i] = Buffer.from(data.buffer).toString("hex");
		};
		
		return frames;
	};
	
	
	
	static async convertToMap(data){
		let resized = await Converter.resizeForMap(data);
		let mapped = await Converter.toMap(resized);
		return mapped;
	};
	
	static async toMap(buf){
		return await mapPixels.fromImage(buf, "image/png");
	};
	
	static async resizeForMap(buf, w, h){
		return await sharp(buf).resize({ 
			width: w || 128,
			height: h || 128,
			options: {
				fit: "cover",
			}
		}).toBuffer();
	};
};


async function downloadYoutube(url, fn="./video.mp4"){
	let videoID = YTDL.getVideoID(url);
	let readable = YTDL(url);
	let emitter = new EventEmitter();
	readable.on("progress", function(len, done, total){
		emitter.emit("progress", total/(100/done), [len, done, total]);
	});
	let w = readable.pipe(fs.createWriteStream(fn));
	w.on("close", function(){
		emitter.emit("finish", fn);
	});
	return emitter;
};


async function youtubeConvert(url){
	let emitter = await downloadYoutube(url);
	let [mp4Name] = await once(emitter, "finish");
	await Converter.extractFrames();
	let frames = await Converter.convertFrames();
	fs.writeFileSync("./video.json", JSON.stringify({
		frames,
		metadata: {
			FPS: 10,
		},
	}));
	return "./video.json";
};





module.exports = {
	parseBuffers,
	VideoPlayer,
	Video,
	Converter,
	downloadYoutube,
	youtubeConvert,
	mapPixels,
};