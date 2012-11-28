var http = require("http");
var socketio = require("socket.io");
var spawn = require("child_process").spawn;
var bridge = __dirname + "/bridge.js";

module.exports = {
	spawn: function(bridgePort, callback, exitCallback) {
		var server = null;
		var phantom = null;
		var io = null;
		var socket = null;
		var port = bridgePort;
		var requests = {};
		var requestCnt = 0;
		var controlPage = getControlPage();
		var p = {
			status: "spawning",
			port: port,
			exitCode: 0
		};

		server = http.createServer(function(request, response) {
			response.writeHead(200, {"Content-Type": "text/html"});
			response.end(controlPage);
		}).listen(port);

		io = socketio.listen(server, {"log level": 1});
		io.sockets.on("connection", function(sock) {
			p.status = "open";
			socket = sock;
			socket.on("disconnect", function(response) {
				try { // Sometimes the server isn't still open
					server.close();
				} catch (e) {
					// ...but we don't really care
				}
			});
			socket.on("res", responseHandler);
			callback(p);
		});

		phantom = spawn("phantomjs", [bridge, port]);
/*
		phantom.stdout.on("data", function(data) {
			return console.log("phantom stdout:  " + data.toString());
		});
		phantom.stderr.on("data", function(data) {
			return console.log("phantom stderr:  " + data.toString());
		});
*/
		phantom.on("exit", function(code) {
			p.status = "closed";
			p.exitCode = code;

			if (exitCallback) {
				exitCallback(code);
			}
		});

		function request(args, callback, cbId) {
			if (typeof(cbId) === "undefined") {
				cbId = (callback) ? requestCnt++ : requestCnt;
			}

			if (callback) {
				requests[cbId] = callback;
			}
			args.splice(0, 0, cbId);
			socket.emit("cmd", serialize(args));
		}

		function responseHandler(response) {
			var msg = JSON.parse(response);
			var cb = requests[msg[0]];
			var cmd = msg[1];
			var res = msg[2];

			if (!cb)
				return;

			switch (cmd) {
				case "execute":
					return cb(res);
				case "executeScript":
					return cb(res);
				case "createWebPage":
					return cb(new WebPage(res));
				case "onPhantomError":
					return cb(res, msg[3]);
				case "openWebPage":
					return cb(res);
				case "evaluate":
					return cb(res);
				case "getProperties":
					return cb(res);
				case "onLoadFinished":
					return cb(res);
				case "onResourceRequested":
					return cb(res);
				case "onPageError":
					return cb(res, msg[3]);
				case "render":
					return cb();
				case "closeWebPage":
					return cb(res);
			}
		}

		p.execute = function(fn, callback) {
			request(["execute", fn], callback);
		};

		p.executeScript = function(fileName, callback) {
			request(["executeScript", fileName], callback);
		};

		p.createWebPage = function(properties, callback) {
			request(["createWebPage", properties], callback);
		};

		p.onError = function(callback) {
			request(["onPhantomError"], callback);
		};

		p.exit = function() {
			request(["exit"]);
		};

		function WebPage(index) {
			var index = index;

			this.open = function(url, callback) {
				request(["openWebPage", index, url], callback);
			};

			this.evaluate = function(fn, callback) {
				request(["evaluate", index, fn], callback);
			};

			this.getProperties = function(properties, callback) {
				request(["getProperties", index, properties], callback);
			};

			this.onLoadFinished = function(callback) {
				var cbId = requestCnt++;

				request(["onLoadFinished", index, cbId], callback, cbId);
			};

			this.onResourceRequested = function(callback) {
				var cbId = requestCnt++;

				request(["onResourceRequested", index, cbId], callback, cbId);
			};

			this.onError = function(callback) {
				var cbId = requestCnt++;

				request(["onPageError", index, cbId], callback, cbId);
			};

			this.render = function(fileName, callback) {
				request(["render", index, fileName]);
			}

			this.close = function(callback) {
				request(["closeWebPage", index], callback);
			};
		}
	}
};

function getControlPage() {
	var html = "<html><head><script src=\"/socket.io/socket.io.js\"></script><script>";
	html += "var socket;";
	html += "window.onload = function() {";
	html += " socket = new io.connect(\"http://\" + window.location.hostname);"
	html += " socket.on(\"cmd\", function(msg) {";
	html += "  alert(msg);";
	html += " });";
	html += "};"
	html += "</script></head><body></body></html>";
	return html;
}

function serialize(obj) {
	return JSON.stringify(obj, function(key, value) {
		if (typeof(value) === "function")
			return value.toString();
		else
			return value;
	});
}
