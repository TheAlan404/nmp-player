const fs = require("fs");
const Item = require('prismarine-item')("1.12.2");
const { EventEmitter } = require("events");

function parseBuffers(array){
	if(array.length && Buffer.isBuffer(array[0])) return array;
	return array.map(f => Buffer.from(f, "hex"));
};

class VideoPlayer extends EventEmitter {
	constructor(server, options={}){
		super();
		this.server = server;
		this.options = options;
		this.loaded = null;
		this.ID = options.ID || 0;
	};
	giveMaps({ slot=36 }){
		let item = Item.toNotch(new Item(358, 1));
		item.itemDamage = this.ID;
		for(let clientID in server.clients) {
			let client = server.clients[clientID];
			client.write("set_slot", {
				windowId: 0,
				slot: slot,
				item: item
			});
		};
	};
	load(src){
		return new Promise(function(resolve){
			if(Array.isArray(src)) {
				this.loaded = new Video(this, src, {});
				resolve(this.loaded);
			} else {
				if(typeof src == "string") {
					this._loadFile(src, resolve);
				};
				if(typeof src == "object") {
					let data = src.frames || src.data || [];
					let meta = src.metadata;
					this.loaded = new Video(this, data, meta);
					resolve(this.loaded);
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
		return new Promise(function(resolve){
			if(resource) this.load(resource);
			if(!this.loaded) throw new Error("Unable to load resource or no resource was loaded");
			this.loaded.play().then(function(video){
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
		for(let clientID in server.clients){
			let client = server.clients[clientID];
			client.write('map', packet);
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
		if(this.playing) return;
		this.VideoPlayer.emit("play", this);
		this.playing = true;
		return new Promise(function(resolve){
			this._interval = setInterval(this._frame, this.FPS, resolve);
		});
	};
	stop(){
		if(this.playing) {
			clearInterval(this._interval);
		};
	};
	_frame(resolve){
		let data = this.data[this._currentFrame];
		if(!data) {
			clearInterval(this._interval);
			this.VideoPlayer.emit("finish", this);
			resolve(this);
			return;
		};
		this.VideoPlayer._frame(data);
		this.VideoPlayer.emit("frame", this, data, this._currentFrame);
		this._currentFrame += 1;
	};
};


module.exports = {
	parseBuffers,
	VideoPlayer,
	Video,
};