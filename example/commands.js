const { CommandHandler, Command } = require("string-commands");
// git clone https://github.com/thealan404/string-commands.git
const Msg = require("./Msg");;

module.exports = function (serv) {
	const handler = new CommandHandler({ prefix: "/" });
	handler.on("incorrectUsage", (cmd, usage, client) => {
		client.chat(new Msg("Error: Incorrect usage: " + cmd + " " + usage, "red"));
	});
	handler.on("unknownCommand", (cmd, _full, client) => {
		client.chat(new Msg("Error: Unknown command: " + cmd, "red"));
	});
	handler.addCommand(new Command({
		name: "play",
		usage: [":src (yt link or local file)"],
		run: (args, client) => {
			let src = args[0];
			try {
				serv.vplayer.play(src);
			} catch (e) {;
				serv.chat(new Msg(e.toString(), "red"));
			};
		},
	}));
	handler.addCommand(new Command({
		name: "p",
		usage: [],
		run: (args, client) => {
			let src = "https://www.youtube.com/watch?v=L3-IiOSTZFU";
			try {
				serv.vplayer.play(src);
			} catch (e) {;
				serv.chat(new Msg(e.toString(), "red"));
			};
		},
	}));
	handler.addCommand({
		name: "setfps",
		usage: [":fps"],
		run: (args) => {
			serv.vplayer.setFrameRate(args[0]);
			serv.chat(new Msg("> FPS set to " +args[0], "gray"))
		},
	});
	handler.addCommand({
		name: "setspeed",
		usage: [":speed"],
		run: (args) => {
			serv.vplayer.setSpeed(args[0]);
			serv.chat(new Msg("> Speed set to " +args[0], "gray"))
		},
	});
	handler.addCommand({
		name: "stop",
		run: () => {
			serv.vplayer.stop();
		},
	});
	handler.addCommand({
		name: "pause",
		run: () => {
			serv.vplayer.stop();
		},
	});
	handler.addCommand({
		name: "ping",
		run: (args, client) => {
			client.chat(new Msg("> Your ping is "+client._socket.latency, "gray"));
		},
	});
	serv.commandhandler = handler;
	return handler;
};






