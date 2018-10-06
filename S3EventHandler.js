/*
 *     Copyright (C) 2005-2018 Haruni SARL.
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


Handler.bind("ObjectCreated:Put", Handler.template({
	contentType : "application/json",

	Behavior: Behavior.template ({
    onRequest(handler, model, query) {
			this.data = handler.request("/S3/getObject", {Bucket: query.bucket.name, Key: query.object.key})
		},
    "/S3/getObject"(handler, model, query) {
      var data = this.data.valueOf();
      var event = JSON.parse(data.Body);
      event.body._event = "ObjectCreated:Put";
      event.body._bucket = query.Bucket;
      event.body._key = query.Key;
      this.result = handler.request(event.path, event.body);
		},
    onComplete(handler, model, query) {
      handler.result = this.result.valueOf();
    }
	})
}));

