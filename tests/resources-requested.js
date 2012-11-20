var fs = require("fs");
console.time("timer");
require("../ghostbuster").spawn(8089, function(phantom) {
	phantom.createWebPage({
		settings: {loadImages: true}
	}, function(page) {
		page.onResourceRequested(function(request) {
			console.log(request.url);
		});

		page.open("http://www.google.com");
	});
});
