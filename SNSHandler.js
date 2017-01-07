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

var SNS = new AWS.SNS();


class SNSCreatePlatformEndpointHandler extends Handler {
	doRequest() {
		try {
			var handler = this, behavior = handler.behavior;
			if (behavior && 'onConstruct' in behavior) {
				var params = behavior.onConstruct(handler, handler.model, handler.query);

        SNS.createPlatformEndpoint(
          {PlatformApplicationArn: params.PlatformApplicationArn, Token: params.Token},
          function(error, data) {
           try {
              if (!error) {
                handler.result = data.EndpointArn;
              }
              else
                handler.doError(new Error('SNS CreatePlatformEndpoint Handler"' + params.Token + '" ' + error));
              handler.synchronize();
            }
            catch (e) {
              _webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('SNS CreatePlatformEndpoint "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			_webkool.application.reportError(handler, e);
		}
	}
}
exports.SNSCreatePlatformEndpointHandler = SNSCreatePlatformEndpointHandler;


class SNSSubcribeHandler extends Handler {
	doRequest() {
		try {
			var handler = this, behavior = handler.behavior;
			if (behavior && 'onConstruct' in behavior) {
				var params = behavior.onConstruct(handler, handler.model, handler.query);

        SNS.subscribe(
          {Protocol: params.Protocol, TopicArn: params.TopicArn, Endpoint: params.Endpoint},
          function(error, data) {
            try {
              if (!error) {
                handler.result = data;
              }
              else
                handler.doError(new Error('SNS Subcribe Handler"' + params.Endpoint + '" ' + error));
              handler.synchronize();
            }
            catch (e) {
              _webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('SNS Subcribe Handler "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			_webkool.application.reportError(handler, e);
		}
	}
}
exports.SNSSubcribeHandler = SNSSubcribeHandler;


class SNSPublishHandler extends Handler {
	doRequest() {
		try {
			var handler = this, behavior = handler.behavior;
			if (behavior && 'onConstruct' in behavior) {
				var params = behavior.onConstruct(handler, handler.model, handler.query);

        SNS.publish(
          { Message: params.Message, MessageStructure: 'json', TargetArn: params.TargetArn },
          function(error, data) {
            try {
              if (!error) {
                handler.result = data;
              }
              else
                handler.result = {MessageId: error.message + " " + params.TargetArn};
              handler.synchronize();
            }
            catch (e) {
              _webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('SNS Publish Handler "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			_webkool.application.reportError(handler, e);
		}
	}
}
exports.SNSPublishHandler = SNSPublishHandler;
