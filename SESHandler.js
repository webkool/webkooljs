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

var webkool = require('./webkool');
var Handler = webkool.Handler;
var Behavior = webkool.Behavior;

var AWS, SES;

class sendEmail extends Handler {

	doRequest() {
    AWS = AWS || require('aws-sdk');
    SES = SES || new AWS.SES();
      
		try {
			var handler = this, behavior = handler.behavior;

			if (behavior && 'onConstruct' in behavior) {
				var params = behavior.onConstruct(handler, handler.model, handler.query);

        var request = {
          Source: params.from, 
          Destination: { ToAddresses: params.to },
          Message: {
            Subject: { Data: params.subject },
            Body: {}
          }
        };
        if (params.text) 
          request.Message.Body.Text = {Data: params.text};
        if (params.html) 
          request.Message.Body.Html = {Data: params.html};

        SES.sendEmail(request,
          function(error, data) {
           try {
              if (!error) {
                handler.result = data;
              }
              else
                handler.doError(new Error('SESHandler.sendEmail ' + error));
              handler.synchronize();
            }
            catch (e) {
              webkool.application.reportError(handler, e);
            }
          }
        );
      }
			else
				throw new Error('SESHandler.sendEmail "' + handler.url + '" has no parameters.');
		}
		catch (e) {
			webkool.application.reportError(handler, e);
		}
	}
}

exports.sendEmail = sendEmail;


Handler.bind("/SES/sendEmail", sendEmail.template({
	contentType : "application/json",

	Behavior: Behavior.template ({
		onConstruct(handler, model, query) {
			return {
				from: query.from,
        to: [query.to],
        subject: query.subject,
        text: query.text,
        html: query.html
			};
		}
	})
}));


