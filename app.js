'use strict';


var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var cfenv = require('cfenv');
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
var appEnv = cfenv.getAppEnv();
//--------------------new ----------------configuration data i wrote -----------------
//construntion.
var Client = require("ibmiotf");
var appClientConfig = {
    "org" : "2fbcv2",
    "id" : "ray27",
    "domain": "internetofthings.ibmcloud.com",
    "auth-key" : "a-2fbcv2-opgagk3i5t",
    "auth-token" : "OsfFOUQS+3Zk_a+vm7"
}

var appClient = new Client.IotfApplication(appClientConfig);
//Add your code here
appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceEvents("iot-phone","ray27","+","json");

});

appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {
                    var  pay= JSON.parse(payload);
  
	var x = pay.d.ax;
	var y = pay.d.ay;
	var z = pay.d.az;

	if( (0.09 <=x || x<= -0.09 ) && (0.09 <=y || y<= -0.09)){
        
        console.log("Device Event from :: "+deviceType+" : "+deviceId+" of event "+eventType+" with payload : "+payload);
      appClient.subscribeToDeviceStatus("iot-phone","ray27");

     console.log(" your phone is motion");
	}else{
		console.log("your phone is on a plane surface");
	}



    

});



process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var config = null;
var credentials = null;
if (process.env.VCAP_SERVICES) {
	config = JSON.parse(process.env.VCAP_SERVICES);

	var iotService = config['iotf-service'];
	for (var index in iotService) {
		if (iotService[index].name === 'discover-iot-try-service') {
			credentials = iotService[index].credentials;
		}
	}
} else {
	console.log("ERROR: IoT Service was not bound!");
}

var basicConfig = {
	org: credentials.org,
	apiKey: credentials.apiKey,
	apiToken: credentials.apiToken
};

var options = {
	host: 'internetofthings.ibmcloud.com',
	port: 443,
	headers: {
	  'Content-Type': 'application/json'
	},
	auth: basicConfig.apiKey + ':' + basicConfig.apiToken
};

app.get('/credentials', function(req, res) {
	res.json(basicConfig);
});

app.get('/iotServiceLink', function(req, res) {
	var options = {
		host: basicConfig.org + '.internetofthings.ibmcloud.com',
		port: 443,
		headers: {
		  'Content-Type': 'application/json'
		},
		auth: basicConfig.apiKey + ':' + basicConfig.apiToken,
		method: 'GET',
		path: 'api/v0002/'
	}
	var org_req = https.request(options, function(org_res) {
		var str = '';
		org_res.on('data', function(chunk) {
			str += chunk;
		});
		org_res.on('end', function() {
			try {
				var org = JSON.parse(str);
				var url = "https://console.ng.bluemix.net/#/resources/serviceGuid=" + org.bluemix.serviceInstanceGuid + "&orgGuid=" + org.bluemix.organizationGuid + "&spaceGuid=" + org.bluemix.spaceGuid;
				res.json({ url: url });
			} catch (e) { console.log("Something went wrong...", str); res.send(500); }
			console.log("iotServiceLink end: ", str.toString());
		});
	}).on('error', function(e) { console.log("ERROR", e); });
	org_req.end();
});

app.post('/registerDevice', function(req, res) {
	console.log(req.body);
	var deviceId = null, typeId = "iot-phone", password = null;
	if (req.body.deviceId) { deviceId = req.body.deviceId; }
	if (req.body.typeId) { typeId = req.body.typeId; }
	if (req.body.password) { password = req.body.password; }

	var options = {
		host: basicConfig.org + '.internetofthings.ibmcloud.com',
		port: 443,
		headers: {
		  'Content-Type': 'application/json'
		},
		auth: basicConfig.apiKey + ':' + basicConfig.apiToken,
		method: 'POST',
		path: 'api/v0002/device/types'
	}

	var deviceTypeDetails = {
		id: typeId
	}
	console.log(deviceTypeDetails);
	var type_req = https.request(options, function(type_res) {
		var str = '';
		type_res.on('data', function(chunk) {
			str += chunk;
		});
		type_res.on('end', function() {
			console.log("createDeviceType end: ", str.toString());

			var dev_options = {
				host: basicConfig.org + '.internetofthings.ibmcloud.com',
				port: 443,
				headers: {
				  'Content-Type': 'application/json'
				},
				auth: basicConfig.apiKey + ':' + basicConfig.apiToken,
				method: 'POST',
				path: 'api/v0002/device/types/'+typeId+'/devices'
			}

			var deviceDetails = {
				deviceId: deviceId,
				authToken: password
			};
			console.log(deviceDetails);

			var dev_req = https.request(dev_options, function(dev_res) {
				var str = '';
				dev_res.on('data', function(chunk) {
					str += chunk;
				});
				dev_res.on('end', function() {
					console.log("createDevice end: ", str.toString());
					res.send({ result: "Success!" });
				});
			}).on('error', function(e) { console.log("ERROR", e); });
			dev_req.write(JSON.stringify(deviceDetails));
			dev_req.end();
		});
	}).on('error', function(e) { console.log("ERROR", e); });
	type_req.write(JSON.stringify(deviceTypeDetails));
	type_req.end();
});

app.listen(appEnv.port, function() {
	console.log("server starting on " + appEnv.url);
});









