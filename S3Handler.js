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

// import {Handler,Behavior} from "./webkool";
var _webkool = require("./webkool");
var Handler = _webkool.Handler;
var Behavior = _webkool.Behavior;


var AWS = require('aws-sdk');
AWS.config.update({
	accessKeyId: _webkool.key,
	secretAccessKey: _webkool.secret,
	region: _webkool.region
});

var S3 = new AWS.S3();

class S3PutObjectHandler extends Handler {
	doRequest() {
		try {
			var handler = this, behavior = handler.behavior;
			if (behavior && 'onConstruct' in behavior) {
				var params = behavior.onConstruct(handler, handler.model, handler.query);

        S3.putObject(
          params,
          function(error, data) {
           try {
              if (!error) {
                handler.result = data;
              }
              else
                handler.doError(new Error('S3 putObject Handler "' + handler.url + '" ' + error));
              handler.synchronize();
            }
            catch (e) {
              _webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('S3 putObject Handler "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			_webkool.application.reportError(handler, e);
		}
	}
}
exports.S3PutObjectHandler = S3PutObjectHandler;


class S3GetObjectHandler extends Handler {
	doRequest() {
		try {
			var handler = this, behavior = handler.behavior;
			if (behavior && 'onConstruct' in behavior) {
				var params = behavior.onConstruct(handler, handler.model, handler.query);

        S3.getObject(
          params,
          function(error, data) {
           try {
              if (!error) {
                handler.result = data;
              }
              else
                handler.doError(new Error('S3 getObject Handler "' + handler.url + '" ' + error));
              handler.synchronize();
            }
            catch (e) {
              _webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('S3 getObject Handler "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			_webkool.application.reportError(handler, e);
		}
	}
}
exports.S3GetObjectHandler = S3GetObjectHandler;
