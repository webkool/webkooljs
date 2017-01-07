/*
 *
 * 			Copyright (C) 2015-2016 Frigo Magic SAS - All Rights Reserved
 *
 * 			Unauthorized copying of this file, via any medium is strictly prohibited
 * 			Proprietary and confidential
 *
 *      Written by Sébastien BUREL <sebastien@frigomagic.com>
 *
 */

"use strict";

// import {Handler,Behavior} from "./webkool";
var _webkool = require("./webkool");
var Handler = _webkool.Handler;
var Behavior = _webkool.Behavior;


// import {S3GetObjectHandler} from "./S3Handler";
var _S3Handler = require("./S3Handler");
var S3GetObjectHandler = _S3Handler.S3GetObjectHandler;
var S3PutObjectHandler = _S3Handler.S3PutObjectHandler;


Handler.bind("/S3EventGetObject", S3GetObjectHandler.template({
	Behavior: Behavior.template ({
		onConstruct(handler, model, query) {
			return {
				Bucket: query.Bucket,
				Key: query.Key,
			};
		},
	})
}));

Handler.bind("/S3EventPutObject", S3PutObjectHandler.template({
	Behavior: Behavior.template ({
		onConstruct(handler, model, query) {
			return {
				Bucket: "backoffice.frigomagic.com",
				Key: query.Key,
				Body: query.Body,
				ContentType: "application/json"
			};
		},
	})
}));

Handler.bind("/S3/ObjectCreated/Put", Handler.template({
	contentType : "application/json",

	Behavior: Behavior.template ({
    onRequest(handler, model, query) {
			this.start = new Date();
			this.key = query.object.key.replace('notify-queue/', 'notify-done/');
			this.s3GetObject = handler.request("/S3EventGetObject", {Bucket: query.bucket.name, Key: query.object.key})
		},
    "/S3EventGetObject"(handler, model, query) {
      var s3GetObject = this.s3GetObject.valueOf();
      var event = JSON.parse(s3GetObject.Body);
      this.result = handler.request(event.path, event.body);
			this[event.path] = this.onRequestDone;
		},
		onRequestDone(handler, model, query) {
      var result = this.result.valueOf();
			result.duration = ((new Date()) - this.start) / 1000;
			this.s3PutObject = handler.request("/S3EventPutObject", {Body: JSON.stringify(result), Key: this.key})
		},
    onComplete(handler, model, query) {
      var result = this.result.valueOf();
      handler.result = {
        status: 'ok',
        code: '200',
				duration: ((new Date()) - this.start) / 1000
      };
    }
	})
}));

