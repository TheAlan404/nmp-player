const UUID = require("uuid");
const Msg = require("./Msg");

let clients = []

class BossBar {
	/**
	 * A BossBar:tm:
	 * @param {object} opts
	 * @param {UUID} opts.UUID
	 * @param {number} opts.color
	 * @param {string} opts.title
	 * @param {number} opts.health - progress bar é (between one and zero, more breaks the mc client's renderer lul)
	 * @example new BossBar({ title: "pogness of null and reis", health: 3 });
	 */
	constructor(serv, opts) {
		this.writeAll = opts.writeAll ? opts.writeAll : () => { throw 'writeAll not passed to function' }
		this.UUID = opts.UUID || UUID.v4();
		this.title = opts.title || "death";
		this.health = opts.health || 1;
		this.color = opts.color || 1;
		serv.on('login', (client) => {
			setTimeout(()=>this.init(client), 10)

			client.on('end', () => {
				clients.forEach(function (c, i) {
					if (c === client) clients.splice(i, 1)
				})
			})
		});
	};
	init(client) {
		client.write("boss_bar", {
			entityUUID: this.UUID,
			action: 0,
			title: JSON.stringify(this.title),
			color: this.color,
			health: this.health,
			dividers: 0,
			flags: 0,
		});
		setTimeout(function () {
			clients.push(client);
		}, 500);
	};
	setTitle(title) {
		this.title = title;
		clients.forEach((client) => {
			client.write("boss_bar", {
				entityUUID: this.UUID,
				action: 3,
				title: JSON.stringify(this.title),
			});
		})
	};
	setHealth(value) {
		if (value > 1) value = 1;
		if (value < 0) value = 0;

		this.health = value;
		this.writeAll("boss_bar", {
			entityUUID: this.UUID,
			action: 2,
			health: value
		})
	};
	setColor(color) {
		if (color < 0 || color > 6) color = 1;
		this.color = color;
		this.writeAll("boss_bar", {
			entityUUID: this.UUID,
			action: 4,
			color
		})
	}
	unload() {
		this.writeAll("boss_bar", {
			entityUUID: this.UUID,
			action: 1,
		});
	};
};


module.exports = BossBar;