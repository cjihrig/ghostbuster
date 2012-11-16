var fs = require("fs");
console.time("timer");
require("../ghostbuster").spawn(8089, function(phantom) {
	var startUrl = "http://www.petsmart.com/product/index.jsp?productId=3195394";
	var cartUrl = "http://www.petsmart.com/cart/index.jsp";
	var addressUrl = "https://www.petsmart.com/checkout/index.jsp?process=address";
	var shippingUrl = "https://www.petsmart.com/checkout/index.jsp?process=shipMethods";
	var paymentUrl = "https://www.petsmart.com/checkout/index.jsp?process=payment";
	var confirmUrl = "https://www.petsmart.com/checkout/index.jsp?process=confirm";
	var processBilling = true;

	phantom.createWebPage({
		settings: {loadImages: false}
	}, function(page) {
		page.onLoadFinished(function(status) {
			page.getProperties(["url", "content"
			], function(properties) {
				if (properties === null) {
					console.log("Properties is null...");
					return;
				}

				var url = properties.url;

				//console.log("Loaded:  " + url);
				if (url === startUrl) {
					doAddToCartPage();
				} else if (url === cartUrl) {
					doCartPage();
				} else if (url === addressUrl) {
					if (processBilling) {
						doBillingPage();
						processBilling = false;
					} else
						doShippingPage();
				} else if (url === shippingUrl) {
					doShippingMethodsPage();
				} else if (url === paymentUrl) {
					doPaymentPage();
				} else if (url === confirmUrl) {
					console.timeEnd("timer");
					console.log("Capturing the confirm page in confirm.png");
					//fs.writeFile("output.html", properties.content, function(err) {});
					page.render("confirm.png");
					phantom.exit();
				}
			});

			function doAddToCartPage() {
				page.evaluate(function() {
					var sel = document.getElementById("3195394_slice1");
					var qty_0 = document.getElementById("qty_0");

					qty_0.value = 3;
					sel.selectedIndex = 5;
					theForm.addToCart();
				});
			}

			function doCartPage() {
				page.evaluate(function() {
					checkout();
				});
			}

			function doBillingPage() {
				page.evaluate(function() {
					var countrySelect = document.getElementById("country");
					var stateSelect = document.getElementById("stateOrProvince");
					var countryIndex = 0;
					var stateIndex = 0;

					for (var i = 0; i < countrySelect.length; i++) {
						if (countrySelect.options[i].value === "US") {
							countryIndex = i;
							break;
						}
					}

					for (var i = 0; i < stateSelect.length; i++) {
						if (stateSelect.options[i].value === "PA") {
							stateIndex = i;
							break;
						}
					}

					document.getElementById("fName").value = "abc";
					document.getElementById("lName").value = "def";
					document.getElementById("addLine1").value = "123 alka st";
					document.getElementById("addLine2").value = "100";
					document.getElementById("checkoutCity").value = "Pittsburgh";
					document.getElementById("zipCode").value = "15123";
					document.getElementById("addrPhone").value = "4122222222";
					document.getElementById("emailAdd").value = "dummy@gmail.com";
					countrySelect.selectedIndex = countryIndex;
					stateSelect.selectedIndex = stateIndex;
					document.getElementById("newBillAdd").checked = true;
					document.querySelector("input.continue-checkout").click();
				});
			}

			function doShippingPage() {
				page.evaluate(function() {
					var countrySelect = document.getElementById("country");
					var stateSelect = document.getElementById("stateOrProvince");
					var countryIndex = 0;
					var stateIndex = 0;

					for (var i = 0; i < countrySelect.length; i++) {
						if (countrySelect.options[i].value === "US") {
							countryIndex = i;
							break;
						}
					}

					for (var i = 0; i < stateSelect.length; i++) {
						if (stateSelect.options[i].value === "PA") {
							stateIndex = i;
							break;
						}
					}

					document.getElementById("fName").value = "abc";
					document.getElementById("lName").value = "def";
					document.getElementById("addLine1").value = "123 alka st";
					document.getElementById("addLine2").value = "100";
					document.getElementById("checkoutCity").value = "Pittsburgh";
					document.getElementById("zipCode").value = "15123";
					document.getElementById("addrPhone").value = "4122222222";
					countrySelect.selectedIndex = countryIndex;
					stateSelect.selectedIndex = stateIndex;
					document.querySelector("input.continue-checkout").click();
				});
			}

			function doShippingMethodsPage() {
				page.evaluate(function() {
					submitShip();
				});
			}

			function doPaymentPage() {
				page.evaluate(function() {
					var typeSelect = document.getElementById("crdType");
					var typeIndex = 0;

					for (var i = 0; i < typeSelect.length; i++) {
						if (typeSelect.options[i].value === "VC") {
							typeIndex = i;
							break;
						}
					}

					typeSelect.selectedIndex = typeIndex;
					document.getElementById("crdNumbr").value = "4111111111111111";
					document.getElementById("cardExpDateMo").value = "12";
					document.getElementById("cardExpDateYr").value = "12";
					document.getElementById("ccPin").value = "123";
					cardinalLookup();
				});
			}

		});
		page.open("http://www.petsmart.com/product/index.jsp?productId=3195394");
	});
});
