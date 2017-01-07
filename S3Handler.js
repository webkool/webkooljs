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
