var fs = require("fs");
console.time("timer");

require("../ghostbuster").spawn(8089, function(phantom) {
	// this should be triggered when page.onError is commented out, but it's not
	phantom.onError(function(msg, trace) {
		console.log("PhantomJS Error!");
		console.log(msg);
		console.log(trace);
	});

	phantom.createWebPage({
		settings: {loadImages: true}
	}, function(page) {
		// when this is commented out, phantom.onError should be triggered
		// but it's not
		page.onError(function(msg, trace) {
			console.log("Page Error!");
			console.log(msg);
			console.log(trace);
		});

		page.onLoadFinished(function(status) {
			console.log("Page finished loading:  " + status);
			phantom.exit();
		});

		page.open("http://www.acehardware.com/product/index.jsp?productId=16854536");
	});
}, function(code) {
	console.log("PhantomJS exited with code:  " + code);
});
