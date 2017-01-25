/*
 *     Copyright (C) 2005-2017 Haruni SARL.
 *     Written by Sébastien BUREL <sb@haruni.net>
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 */

"use strict";

var webkool = require("./webkool");
var Handler = webkool.Handler;
var Behavior = webkool.Behavior;

var S3Handler = require("./S3Handler");


Handler.bind("/S3EventGetObject", S3Handler.getObject.template({
	Behavior: Behavior.template ({
		onConstruct(handler, model, query) {
			return {
				Bucket: query.Bucket,
				Key: query.Key,
			};
		},
	})
}));


Handler.bind("/S3EventPutObject", S3Handler.putObject.template({
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

