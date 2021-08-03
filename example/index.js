console.log("Loading libraries...");
const mc = require("minecraft-protocol");
const fs = require("fs");
const Item = require('prismarine-item')("1.12.2");
const Msg = require("./Msg.js");
const BossBar = require('./bossbar.js');
const InitCommands = require("./commands");
const UUID = require("uuid");
const { VideoPlayer, DisplayList } = require("../index");// nmp-player

if(!fs.existsSync("./chunk") && fs.existsSync("./example")) process.chdir("./example");

console.log("Starting server...");

const server = mc.createServer({
	port: 25565,
	"online-mode": false,
	version: "1.12.2",
	maxPlayers: 255,
});

console.log("Initializing video player...");
const player = new VideoPlayer(new DisplayList(4, 2, [1, 2, 3, 4, 5, 6, 7, 8]));
server.vplayer = player;
player.processFrame = (displays) => {
	for (let mapID in displays) {
		server.sendMapData(mapID, displays[mapID]);
	};
};

console.log("Initializing commands...");
let handler = InitCommands(server);

server.debug_bossbar = new BossBar(server, {
	writeAll: server.writeAll,
	title: "Loading...",
});

server.stats_bossbar = new BossBar(server, {
	writeAll: server.writeAll,
	title: "Loading...",
});

setInterval(() => {
	server.debug_bossbar.setTitle([
		new Msg("state=", "dark_gray"),
		new Msg(server.vplayer.state, "white"), 
		new Msg(" | frames=", "dark_gray"),
		new Msg(server.vplayer.frames.length || "0", "blue"),
		new Msg(" | fps=", "dark_gray"),
		new Msg(server.vplayer.frameRate, "green"),
		new Msg(" | speed=", "dark_gray"),
		new Msg(server.vplayer.speed, "green"),
	]);
	server.stats_bossbar.setTitle([
		new Msg("mem=", "dark_gray"),
		new Msg(Math.round((process.memoryUsage().rss / 1024) / 1024), "gold"),
		new Msg("MB", "gray"),
	])
}, 500);

server.on("login", (client) => {
	const entityId = _EID++;
	client.entityId = entityId;

	client.chat = (d) => {
		client.write("chat", { message: JSON.stringify(d), });
	};

	client.write('login', { entityId, levelType: 'default', gameMode: 2, dimension: 0, difficulty: 0, maxPlayers: server.maxPlayers, reducedDebugInfo: false });
	client.write('position', { x: 10, y: 65, z: 8, yaw: 90, pitch: 0, flags: 0x00, teleportId: 1 });
	loadStuff(client);
	
	client.on('position', (packet) => {
		if(packet.y < 61) client.write("position", {
			x: 10, y: 65, z: 8, yaw: 90, pitch: 0, flags: 0x00, teleportId: 1
		});
	})

	server.chat([new Msg(client.username, "gold"), new Msg(" joined.", "yellow")]);
	console.log(`${client.username} joined.`);

	client.on("chat", ({ message }) => {
		if (message.startsWith("/")) {
			handler.run(message, client, client);
		} else {
			server.chat([new Msg(client.username, "gold"), new Msg(": ", "reset"), new Msg(message, "yellow")]);
			console.log(`${client.username}: ${message}`);
		};
	});

	client.on('tab_complete', (packet) => {
		if(!packet.text.startsWith('/')) return;
		let res = [];
		for(const command_e of handler.commands.entries()) {
			let command = command_e[0];
			const info = command_e[1];
			if(typeof command !== "string") {
				command = command[0];
			}

			if(packet.text === `/${command}`) {
				console.log(packet.text);
				if(info.usage[0]) {
					res = [`${packet.text} ${info.usage[0]}`];
				} else {
					res = [`${packet.text}`]
				}
				break;
			}

			if(command.startsWith(packet.text.replace('/',''))) {
				res.push(`/${command}`)
			}
		}

		client.write('tab_complete', {
			count: res.length,
			matches: res
		})
	})

	client.on("end", () => {
		server.chat([new Msg(client.username, "gold"), new Msg(" left.", "yellow")]);
		console.log(`${client.username} left.`);
	});
	
	client.chat(new Msg().text("Welcome to the test server").color("dark_aqua"));
	
	client.isReady = true;
});

const itemFrame = (x, y, z, id) => {
	return {
		entityId: id,
		objectUUID: UUID.v4(),
		type: 71,
		x: x,
		y: y,
		z: z,
		pitch: 0,
		yaw: -64,
		objectData: id,
		velocityX: 0,
		velocityY: 0,
		velocityZ: 0
	};
};

function spawnDisplay(client, x, y, z, mapID = 1, frameEID) {
	if (!frameEID) frameEID = Math.floor(Math.random() * 32767) + 32767;
	client.write("spawn_entity", itemFrame(x, y, z, frameEID));
	let item = Item.toNotch(new Item(358, 1));
	item.itemDamage = mapID;
	client.write("entity_metadata", {
		entityId: frameEID,
		metadata: [
			{
				key: 6,
				type: 5,
				value: item
			}
		]
	});
};

function loadStuff(client) {
	client.write('map_chunk', {
		x: 0, z: 0, groundUp: true, bitMap: 24,
		chunkData: Buffer.from(fs.readFileSync("./chunk", 'utf-8'), 'hex'),
		blockEntities: []
	});
	let mapId = 0;
	for (let y = 66; y >= 65; y--) {
		for (let z = 9; z >= 6; z--) {
			spawnDisplay(client, 4, y, z, (++mapId))
		}
	}

}

let _EID = 1;

server.writeAll = (n, d) => {
	let dontSendToNew = false;
	if(!n == "map") dontSendToNew = true;
	for (let i in server.clients) {
		//if(!server.clients[i].isReady && dontSendToNew) continue;
		server.clients[i].write(n, d);
	};
};

server.sendMapData = (mapID, data) => {
	if (!data) return console.log("sendMapData mapData is not defined, aborted.");
	data = Buffer.isBuffer(data) ? data : Buffer.from(data, "hex");
	if (data.length !== 128 * 128) console.log("WARNING: sendMapData data length is not 128*128, it is ", data.length);
	server.writeAll("map", {
		itemDamage: mapID,
		scale: 4,
		trackingPosition: false,
		icons: [],
		columns: -128,
		rows: -128,
		x: 0,
		y: 0,
		data: (data),
	});
};

server.chat = (d) => server.writeAll("chat", { message: JSON.stringify(d), });

console.log("Finished initialization");


//