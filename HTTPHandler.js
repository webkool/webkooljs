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

var webkool = require('webkooljs').webkool;
var Handler = webkool.Handler;

class HTTPHandler extends Handler {

	constructor(parent, url, query, it) {
		super(parent, url, query, it);
		this.method = "GET";
		this.host = "";
	}

	doRequest() {
		var client = this.getXMLHttpRequest();
		var savedUrl = this.url;
		var savedQuery = this.query;
		var behavior = this.behavior;
			if ('onConstruct' in behavior) {
				var data = behavior.onConstruct(this, this.model, this.query);

			for (var i in data)
				this[i] = data[i];
		}

		var url = this.url;
		if (this.host)
			url = this.host + url;

		var params = this.serializeQuery(this.query);
		if (params) {
			if (this.method == "GET")
				url += "?" + params;
		}
		this.url = savedUrl;
		this.query = savedQuery;
		client.open(this.method, url);
		if (this.method == "GET")
			client.send();
		else {
			client.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
			client.send(params);
		}
	}

	getXMLHttpRequest() {
		var client;
		if (typeof XDomainRequest === "undefined") {
			if (typeof XMLHttpRequest === "undefined") {
        var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
				client = new XMLHttpRequest();
				client.onreadystatechange = this.onreadystatechange.bind(client, this);
 			}
			else {
				client = new XMLHttpRequest();
				client.onreadystatechange = this.onreadystatechange.bind(client, this);
			}
		}
		else {
			client = new XDomainRequest();
			client.setRequestHeader = function () {return;};
			client.onload = this.onload.bind(client, this);
			client.ontimeout = this.ontimeout.bind(client, this);
		}
		return client;
	}

	onload(handler) {
		try {
			try {
				handler.result = JSON.parse(this.responseText);
			}
			catch (error) {
				handler.doError(error);
			}
			handler.synchronize();
		}
		catch (error) {
			webkool.application.reportError(handler, error);
		}
	}

	onreadystatechange(handler) {
		try {
			if (this.readyState === this.DONE) {
				if (this.status === 200) {
					try {
						handler.result = JSON.parse(this.responseText);
					}
					catch (error) {
						handler.doError(error);
					}
					handler.synchronize();
				}
				else if (this.status === 0) {
					handler.doError(new Error('Could not reach Server'));
					handler.synchronize();
				}
				else if (this.status) {
					handler.responseText = this.responseText;
					handler.doError(new Error('Server error ('+this.status+')'));
					handler.synchronize();
				}
			}
		}
		catch (error) {
			webkool.application.reportError(handler, error);
		}
	}

	ontimeout(handler) {
		try {
			handler.doError(new Error('La connexion Internet semble interrompue.'));
			handler.synchronize();
		}
		catch (error) {
			webkool.application.reportError(handler, error);
		}
	}
}
exports.HTTPHandler = HTTPHandler;
