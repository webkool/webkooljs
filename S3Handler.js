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

var AWS, S3;

class deleteObject extends webkool.Handler {
	doRequest() {
    AWS = AWS || require('aws-sdk');
    S3 = S3 || new AWS.S3();

		try {
			var handler = this, behavior = handler.behavior;
			if (behavior && 'onConstruct' in behavior) {
				var params = behavior.onConstruct(handler, handler.model, handler.query);

        S3.deleteObject(
          params,
          function(error, data) {
           try {
              if (!error) {
                handler.result = data;
              }
              else
                handler.doError(new Error('S3Handler.deleteObject "' + handler.url + '" ' + error));
              handler.synchronize();
            }
            catch (e) {
              webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('S3Handler.deleteObject "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			webkool.application.reportError(handler, e);
		}
	}
}
exports.deleteObject = deleteObject;


class getObject extends webkool.Handler {
	doRequest() {
    AWS = AWS || require('aws-sdk');
    S3 = S3 || new AWS.S3();

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
                handler.doError(new Error('S3Handler.getObject "' + handler.url + '" ' + error));
              handler.synchronize();
            }
            catch (e) {
              webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('S3Handler.getObject "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			webkool.application.reportError(handler, e);
		}
	}
}
exports.getObject = getObject;


class putObject extends webkool.Handler {

	doRequest() {
    AWS = AWS || require('aws-sdk');
    S3 = S3 || new AWS.S3();

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
                handler.doError(new Error('S3Handler.putObject "' + handler.url + '" ' + error));
              handler.synchronize();
            }
            catch (e) {
              webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('S3Handler.putObject "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			webkool.application.reportError(handler, e);
		}
	}
}
exports.putObject = putObject;


Handler.bind("/S3/deleteObject", S3Handler.deleteObject.template({
	Behavior: Behavior.template ({
		onConstruct(handler, model, query) {
			return {
				Bucket: query.Bucket,
				Key: query.Key
			};
		},
	})
}));


Handler.bind("/S3/getObject", S3Handler.getObject.template({
	Behavior: Behavior.template ({
		onConstruct(handler, model, query) {
			return {
				Bucket: query.Bucket,
				Key: query.Key,
			};
		},
	})
}));


Handler.bind("/S3/putObject", S3Handler.putObject.template({
	Behavior: Behavior.template ({
		onConstruct(handler, model, query) {
			return {
				Bucket: query.Bucket,
				Key: query.Key,
				Body: query.Body,
				ContentType: query.ContentType
			};
		},
	})
}));
