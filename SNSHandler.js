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

var AWS, SNS;

class createPlatformEndpoint extends Handler {

	doRequest() {
    AWS = AWS || require('aws-sdk');
    SNS = SNS || new AWS.SNS();

		try {
			var handler = this, behavior = handler.behavior;
			if (behavior && 'onConstruct' in behavior) {
				var params = behavior.onConstruct(handler, handler.model, handler.query);

        SNS.createPlatformEndpoint(
          {PlatformApplicationArn: params.PlatformApplicationArn, Token: params.Token},
          function(error, data) {
           try {
              if (!error) {
                handler.result = data;
              }
              else
                handler.doError(new Error('SNSHandler.createPlatformEndpoint "' + params.Token + '" ' + error));
              handler.synchronize();
            }
            catch (e) {
              webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('SNSHandler.createPlatformEndpoint "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			webkool.application.reportError(handler, e);
		}
	}
}
exports.createPlatformEndpoint = createPlatformEndpoint;


class publish extends Handler {
	doRequest() {
    AWS = AWS || require('aws-sdk');
    SNS = SNS || new AWS.SNS();

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
                handler.result = {TargetArn: params.TargetArn, ErrorId: error.message};
              handler.synchronize();
            }
            catch (e) {
              webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('SNSHandler.publish "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			webkool.application.reportError(handler, e);
		}
	}
}
exports.publish = publish;


class subcribe extends Handler {
	doRequest() {
    AWS = AWS || require('aws-sdk');
    SNS = SNS || new AWS.SNS();

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
                handler.doError(new Error('SNSHandler.subscribe"' + params.Endpoint + '" ' + error));
              handler.synchronize();
            }
            catch (e) {
              webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('SNSHandler.subscribe "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			webkool.application.reportError(handler, e);
		}
	}
}
exports.subcribe = subcribe;


Handler.bind("/SNS/createPlatformEndpoint", createPlatformEndpoint.template({
	contentType : "application/json",

	Behavior: Behavior.template ({
		onConstruct(handler, model, query) {
			return {
        Token : query.Token,  
        PlatformApplicationArn : query.PlatformApplicationArn
			};
		}
	})
}));


Handler.bind("/SNS/publish", publish.template({
	contentType : "application/json",

	Behavior: Behavior.template ({
		onConstruct(handler, model, query) {
			return {
        Message: query.Message,
        TargetArn: query.TargetArn
			};
		}
	})
}));


Handler.bind("/SNS/subcribe", subcribe.template({
	contentType : "application/json",

	Behavior: Behavior.template ({
		onConstruct(handler, model, query) {
			return {
        Protocol: query.Protocol,
        TopicArn: query.TopicArn,
        Endpoint: query.Endpoint
			};
		}
	})
}));
