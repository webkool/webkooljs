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

var application = exports.application = {
	properties: {}
};

class Behavior {

	constructor(it) {
		for (var i in it) {
			this[i] = it[i];
		}
	}
	
	onComplete(handler, model, query) {
	}
	
	onError(handler, model, error) {
		application.error("Error in " + handler.url + ": " + error.toString());
	}
	
	onLoad(handler, model, query) {
	}
	
	onRender(handler, scope) {
		if (handler) {
			if (handler.contentType == 'application/json' && handler.result)
				return JSON.stringify(scope, null, 4);
			application.warn("WARNING '" + handler.url + "' has no rendering.");
		}
	}
	
	onRequest(handler, model, query) {
	}
	
	static template(it0) {
		var constructor = this;
		var result;
		if (it0) {
			result = function(it1) {
				var it = {};
				for (var i in it0)
					it[i] = it0[i];
				if (it1) {
					for (i in it1) {
						it[i] = it1[i];
					}
				}
				return new constructor(it);
			};
			result.prototype = this.prototype;
			result.template = this.template;
		}
		else {
			result = this;
		}
		return result;
	}
}
exports.Behavior = Behavior;

class Template {
	constructor(name, it) {
		this.name = name;
		for (var i in it) {
			this[i] = it[i];
		}	
	}
	
	onRender(handler, scope) {
		return '';
	}

	static bind(name, template) {
		templateConstructors[name] = template;
	}
	
	static template(it0) {
		var constructor = this;
		var result;
		if (it0) {
			result = function(name, it1) {
				var it = {};
				for (var i in it0)
					it[i] = it0[i];
				if (it1) {
					for (i in it1) {
						it[i] = it1[i];
					}
				}
				return new constructor(name, it);
			};
			result.prototype = this.prototype;
			result.template = this.template;
		}
		else {
			result = constructor;
		}
		return result;
	}
}
exports.Template = Template;


class Handler {
	
	constructor(parent, url, query, it) {
		for (var i in it)
			this[i] = it[i];

		this.contentType = this.contentType ? this.contentType : 'text/html';
		this.status = this.status ? this.status : 200;
		this.filter = this.filter ? this.filter : null;
		this.parent = null;
		this.model = null;
		this.query = null;
		this._error = null;
		this._first = null;
		this._last = null;
		this._next = null;
		this._previous = null;
		this._request = null;
		this._response = null;
		this._target = null;
		this._completed = false;

		if (parent) {
			if (parent._first) {
				this._previous = parent._last;
				parent._last._next = this;
			}
			else
				parent._first = this;
			parent._last = this;
			this.parent = parent;
			this.model = parent.model;
		}
		else
			this.model = application.getModel();
		this.url = url;
		this.query = query;
		if (this.Behavior) {
			this.behavior = new this.Behavior();					
		}
		else {
			this.behavior = new Behavior();					
		}
	}
	
	cancel() {
		this._error = new Error('Canceled');
		this.synchronize();
	}
	
	dequeue(child) {
		if (!child._error) {
			var event = child.url;
			var behavior = this.behavior;
			if (behavior && (event in behavior))
				behavior[event].call(behavior, this, this.model, child.query);
		}
		var previous = child._previous;
		var next = child._next;
		if (previous)
			previous._next = next;
		else
			this._first = next;
		if (next)
			next._previous = previous;
		else
			this._last = previous;

		if (child._error && !this._error)
			this.doError(child._error);

		this.synchronize();
	}
	
	doError(error) {
		this._error = error;
	}
	
	doRender() {
		var buffer, result, behavior = this.behavior;
		if (this._response) {
				result = behavior.onRender.call(behavior, this, this.result || {});
				if (result) {
					buffer = new Buffer(result);
					this._response.writeHead(this.status, { 'Content-Type': this.contentType, 'Content-Length': buffer.length });
					this._response.end(buffer);
				}
		}
		else if (this._target) {
			result = behavior.onRender.call(behavior, this, this.result || {});
			if (result) {
				this._target.innerHTML = result;
				behavior.onLoad.call(behavior, this, this.model, this.query);
			}
		}
		else if (this._callback) {
			result = behavior.onRender.call(behavior, this, this.result || {});
			if (result) {
				this._callback(null, this.result || {});
			}
		}
	}
	
	doRequest() {
		application.schedule(this.doRequestTimeout.bind(this));
	}
	
	doRequestTimeout() {
		try {
			try {
				this.behavior.onRequest(this, this.model, this.query);
			}
			catch(error) {
				this.doError(error);
			}
			this.synchronize();
		}
		catch (error) {
			application.reportError(this, error);
		}
	}
	
	getFilter() {
		return this.filter;
	}
	
	redirect(url, query) {
		application.debug("> " + url);
		query = query || {};
		var target = this.parent;
		if (!this._completed)
			application.warn("WARNING! '" + this.url + "': redirect to '" + url + "' called before complete.");
		if (target)
			application.warn("WARNING! '" + this.url + "': redirect to '" + url + "' called.");

		var _constructor = application.findHandler(url, query);
		var handler = new _constructor(target, url, query);

		if ("_request" in this) {
			handler._request = this._request;
			delete this._request;
		}
		if ("_response" in this) {
			handler._response = this._response;
			delete this._response;
		}
		if ("_target" in this) {
			handler._target = this._target;
			delete this._target;
		}
		handler.doRequest();
		return handler;
	}
	
	request(url, query) {
		application.debug("> " + url);
		query = query || {};
		var parent = this;
		if (this._completed) {
			parent = this.parent;
			if (!parent) {
				application.warn("WARNING! '" + this.url + "': request '" + url + "' detached.");
				return this.redirect(url, query);
			}
		}
		var _constructor = application.findHandler(url, query);
		var handler = new _constructor(parent, url, query);
		handler.doRequest();
		return handler;
	}
	
	serializeQuery(query) {
		var items = [], name;
		for (name in query) {
			items.push(name + '=' + encodeURIComponent(query[name]));
		}
		return items.join('&');
	}
	
	synchronize() {
		if (!this._last) {

			if (!this._error) {
				this._completed = true;
				this.behavior.onComplete(this, this.model, this.query);
			}
			else
				this.behavior.onError(this, this.model, this._error);

			if (this.parent)
				this.parent.dequeue(this);
			else {
				if (!this._error)
					this.doRender();
				else
					throw this._error;
			}
		}
	}
	
	valueOf() {
		return this.result;
	}

	static bind(url, handler) {
		handlerConstructors[url] = handler;
		if (handler.filter) {
			filters[url] = handler.filter;
		}
		else {
			var filter = handler.prototype.getFilter();
			if (filter) {
				filters[url] = filter;
			}
		}
	}

	static template(it0) {
		var constructor = this;
		var result;
		if (it0) {
			result = function(parent, url, query, it1) {
				var it = {};
				for (var i in it0)
					it[i] = it0[i];
				if (it1) {
					for (i in it1)
						it[i] = it1[i];
				}
				return new constructor(parent, url, query, it);
			};
			result.prototype = this.prototype;
			result.filter = it0.filter;
			result.template = this.template;
		}
		else {
			result = constructor;
		}
		return result;
	}
}
exports.Handler = Handler;

class Model {
}
exports.Model = Model;

const Error404Handler = Handler.template({
	contentType : "text/html",
	status : "404",
	Behavior: Behavior.template ({
		onComplete(handler, model, query) {
			handler.result = {
				url: handler.url,
			};
		},
		
		onRender(handler, scope) {
			return `<!DOCTYPE html>
			<html>
				<head>
					<title>Error 404</title>
				</head>
				<body>
					<h1>Not Found</h1><p>The requested URL "${scope.url}" was not found on this server.</p>
				</body>
			</html>`
		}
	})
});

var handlerConstructors = {};
var templateConstructors = {};
var filters = {};

class Application {
	
	constructor() {
		application = exports.application = this;
		this.debugging = false;
		this.properties = {port: 8080};
		this.warning = true;
		this.addHandler("/error404", Error404Handler);
	}
	
	addHandler(url, handler, filter) {
		handlerConstructors[url] = handler;
		if (filter)
			filters[url] = filter;
		else {
			filter = handler.prototype.getFilter();
			if (filter)
				filters[url] = filter;
		}
	}
	
	addProperty(name, property) {
		this.properties[name] = property;
	}
	
	addTemplate(name, template) {
		templateConstructors[name] = template;
	}
	
	debug() {
		if (this.debugging) {
			console.log.apply(console, arguments);
		}
	}
	
	error() {
		console.log.apply(console, arguments);
	}
	
	findHandler(url, query) {
		var constructor = handlerConstructors[url];
		if (constructor) {
			var filter = filters[url];
			if (filter && !(filter)(url, query)) {
				constructor = undefined;				
			}
		}
		if (!constructor) {
			for (var url1 in filters) {
				if ((filters[url1])(url, query)) {
					constructor = handlerConstructors[url1];
					break;					
				}
			}
		}
		if (!constructor) {
			this.error("Handler not found '" + url + "'");
			constructor = handlerConstructors['/error404'];
		}
		return constructor;
	}
	
	findTemplate(name) {
		return templateConstructors[name];
	}
	
	getModel() {
		if (!this.model)
			this.model = new Model();
		return this.model;
	}
	
	parseQuery(url, query) {
		var param, params, i, l;
		query = query || {};
		if (url) {
			params = url.split('&');
			l = params.length;
			for (i = 0; i < l; i += 1) {
				param = params[i].split('=');
				if (param.length == 2)
					query[param[0]] = decodeURIComponent(param[1]);
			}
		}
		return query;
	}
	
	render(url, scope) {
		scope = scope || {};
		var _constructor = this.findTemplate(url);
		if (_constructor) {
			var template = new _constructor(url, {});
			return template.onRender(undefined, scope);
		}
		else {
			throw 'Template "' + url + '" not found!';
		}
	}
	
	reportError(handler, error) {
		var message = error.toString();
		if (error.stack)
			message += '\n' + error.stack.toString();

		while (handler.parent)
			handler = handler.parent;

		if (handler) {
			if (handler._response)
				this.sendErrorToResponse(handler._response, handler.url, message);
			else if (handler._target) {
				document.title = "500 Internal error";
				handler._target.innerHTML = `
				<h1>Internal Server Error</h1>
				<p>The requested URL "${handler.url}" encounter the following error : 
				${message.replace(/\n/g, '<br/>')}
				</p>`;
			}
		}
		this.error(message);
	}
	
	request(url, query) {
		query = query || {};
		var _constructor = this.findHandler(url, query);
		var handler = new _constructor(null /*parent*/, url, query);
		handler.doRequest();
		return handler;
	}
	
	schedule(callback) {
		return setImmediate(callback);
	}
	
	sendErrorToResponse(response, url, message) {
		var html = `<!DOCTYPE HTML>
		<html>
			<head>
				<title>500 Internal Server Error</title>
			</head>
			<body>
				<h1>Internal Server Error</h1>
				<p>The requested URL "${url}" encounter and error : ${message.replace(/\n/g, '<br/>')}</p>
			</body>
		</html>`;
		response.writeHead(500, { 'Content-Type': 'text/html', 'Content-Length': html.length });
		response.end(html);
	}
	
	warn() {
		if (this.warning) {
			console.log.apply(console, arguments);
		}
	}
}
exports.Application = Application;

class Client extends Application {
	
	constructor() {
		super();
		if ("onhashchange" in window) {
			window.onhashchange = function () {
				application.request(window.location.hash.substring(1));
			};
		}
		else {
			var storedHash = window.location.hash;
			window.setInterval(function () {
				if (window.location.hash != storedHash) {
					storedHash = window.location.hash;
					application.request(window.location.hash.substring(1));
				}
			}, 100);
		}		
	}
	
	landing(url) {
		if (window.location.hash) {
			this.request(window.location.hash.substring(1));
		}
		else {
			window.location = window.location.href + "#" + url;
		}
	}
	
	request(url, query) {
		var offset = url.indexOf('?');
		if (offset > 0) {
			query = this.parseQuery(url.substring(offset + 1), query);
			url = url.substring(0, offset);
		}
		var handler = super.request(url, query);
		handler._target = document.body;
	}
	
	schedule(callback) {
		return setTimeout(callback, 1);
	}
}
 

class Tool extends Application {
	constructor(_callback) {
		super();
		this._callback = _callback;
	}
	
	request(url, query) {
		var offset = url.indexOf('?');
		if (offset > 0) {
			query = this.parseQuery(url.substring(offset + 1), query);
			url = url.substring(0, offset);
		}
		var handler = super.request(url, query);
		handler._callback = this._callback;
	}
	
	reportError(handler, error) {
		var message = error.toString();
		if (error.stack)
			message += '\n' + error.stack.toString();

		this._callback(message, null);
	}
}
exports.Tool = Tool;

class Server extends Application {
	
	constructor() {
		super();
		this.httpServer = undefined;
	}
	
	getModel() {
		return new Model();
	}
	
	httpRequest(request, response) {
		var formidable = require('formidable');
		var query = {}, url = request.url, handler;

		try	{
			this.debug("# " + url);
			if (request.method === 'POST') {
				if (url.indexOf('?') > 0)
					throw new Error("POST request should not have a query: " + url);

				var server = this;
				if (request.headers['content-type'] == 'text/plain;charset=UTF-8') {
					request.headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
				}

				var form = new formidable.IncomingForm();
				form.on('error', function (error) {
					throw error;
				});
				form.on('field', function (field, value) {
					query[field] = value;
				});
				form.onPart = function (part) {
					if (!part.filename)
						return form.handlePart(part);

					var buffer = new Buffer(0);
					part.on('data', function (data) {
						buffer = Buffer.concat([buffer, data]);
					});
					part.on('end', function () {
						query.data = buffer;
					});
					part.on('error', function (error) {
						throw error;
					});
				};
				form.on('end', function () {
					handler = server.request(url, query);
					handler._response = response;
					handler._request = request;
				});
				form.parse(request);
			}
			else {
				var offset = url.indexOf('?');
				if (offset > 0) {
					query = this.parseQuery(url.substring(offset + 1));
					url = url.substring(0, offset);
				}
				handler = this.request(url, query);
				handler._response = response;
				handler._request = request;
			}
		}
		catch (error) {
			var message;
			if (error.stack)
				message = error.stack.toString();
			else
				message = error.toString();
			this.error(message);
			this.sendErrorToResponse(response, request.url, message);
		}
	}
	
	start() {
		var http = require('http'), server = this;
		this.httpServer = http.createServer(function(request, response) {
			server.httpRequest(request, response);
		});
		this.debug('server listening on port: ' + this.properties.port);
		this.httpServer.listen(this.properties.port);
	}
	
	stop() {
		if (this.httpServer) {
			this.debug('stop listening on port: ' + this.properties.port);
			this.httpServer.close();
		}
		this.httpServer = undefined;
	}	
}
exports.Server = Server;
