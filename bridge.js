var webpage = require("webpage");
var fs = require("fs");
var args = require("system").args;
var port = args[1];
var controlpage = webpage.create();

var pages = {};
var pageCnt = 0;

controlpage.open("http://127.0.0.1:" + port, function(status) {
});

controlpage.onAlert = function(message) {
	var msg = deserialize(message);
	var cmd = msg[1];

	switch (cmd) {
		case "execute":
			execute(msg);
			break;
		case "executeScript":
			executeScript(msg);
			break;
		case "createWebPage":
			createWebPage(msg);
			break;
		case "openWebPage":
			openWebPage(msg);
			break;
		case "evaluate":
			evaluate(msg);
			break;
		case "getProperties":
			getProperties(msg);
			break;
		case "onLoadFinished":
			onLoadFinished(msg);
			break;
		case "onResourceRequested":
			onResourceRequested(msg);
			break;
		case "render":
			render(msg);
			break;
		case "closeWebPage":
			closeWebPage(msg);
			break;
		case "exit":
			exit(msg);
			break;
	}
};

function respond(args) {
	controlpage.evaluate(function(res) {
		socket.emit("res", JSON.stringify(res));
	}, args);
}

function execute(req) {
	var id = req[0];
	var fn = req[2];
	var res = fn(id);

	respond([req[0], "execute", res]);
}

function executeScript(req) {
	var fileName = req[2];
	var contents;

	if (fs.isFile(fileName) && fs.isReadable(fileName)) {
		contents = fs.read(fileName);

		eval(contents);
	}
//phantom.injectJs(fileName);
	respond([req[0], "executeScript"]);
}

function createWebPage(req) {
	var page = webpage.create();
	var index = pageCnt++;
	var props = req[2];

	_setProperties(page, props);
	pages[index] = page;
	respond([req[0], "createWebPage", index]);
}

function openWebPage(req) {
	var index = req[2];
	var url = req[3];
	var page = pages[index];

	page.open(url);
	respond([req[0], "openWebPage", index]);
}

function evaluate(req) {
	var index = req[2];
	var fn = req[3];
	var page = pages[index];
	var returnValue = page.evaluate(fn);

	respond([req[0], "evaluate", returnValue]);
}

function onLoadFinished(req) {
	var index = req[2];
	var cbId = req[3];
	var page = pages[index];

	page.onLoadFinished = function(status) {
		respond([req[0], "onLoadFinished", status]);
	};
}

function onResourceRequested(req) {
	var index = req[2];
	var cbId = req[3];
	var page = pages[index];

	page.onResourceRequested = function(request) {
		respond([req[0], "onResourceRequested", request]);
	};
}

function closeWebPage(req) {
	var index = req[2];
	var page = pages[index];

	page.close();
	pages[index] = null;
	respond([req[0], "closeWebPage", index]);
}

function exit(req) {
	phantom.exit();
}

function getProperties(req) {
	var index = req[2];
	var props = req[3];
	var page = pages[index];
	var returnValue = {};

	for (var i = 0, len = props.length; i < len; i++) {
		var prop = props[i];

		returnValue[prop] = page[prop];
	}

	respond([req[0], "getProperties", returnValue]);
}

function render(req) {
	var index = req[2];
	var fileName = req[3];
	var page = pages[index];

	page.render(fileName);
	respond([req[0], "render", index]);
}

function _setProperties(page, props) {
	function mergeObjects(src, dest) {
		for (var name in src) {
			if (dest.hasOwnProperty(name)) {
				if (typeof(dest[name]) === "object") {
					mergeObjects(src[name], dest[name]);
				} else {
					dest[name] = src[name];
				}
			}
		}
	}

	mergeObjects(props, page);
}

function deserialize(str) {
	return JSON.parse(str, function(key, value) {
		if (typeof(value) === "string" && value.indexOf("function") === 0) {
			try {
				var startBody = value.indexOf("{") + 1;
				var endBody = value.lastIndexOf("}");
				var startArgs = value.indexOf("(") + 1;
				var endArgs = value.indexOf(")");

				return new Function(value.substring(startArgs, endArgs), value.substring(startBody, endBody));
			} catch(e) {
				return value;
			}
		} else
			return value;
	});
}
