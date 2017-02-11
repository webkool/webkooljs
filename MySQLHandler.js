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

// import {Handler,application} from "./webkool";
var _webkool = require("./webkool");
var Handler = _webkool.Handler;

class _MySQL {
	constructor() {
		this._connection = null;
		this._mysql = null;
	}

	_onDisconnect() {
		var MySQL = this;
		this._connection.on('error', function (error) {
			if (!error.fatal) {
				return;
			}
			if (error.code !== 'PROTOCOL_CONNECTION_LOST') {
				throw error;
			}
			_webkool.application.warn('Re-connecting lost connection: ' + error.stack);

			MySQL._connection = MySQL._mysql.createConnection(this._connection.config);
			MySQL._onDisconnect();
			MySQL._connection.connect();
		});
	}
	
	close() {
		this._connection.end(function(err) {
		});
	}
	
	connect(host, user, database, password, charset) {
		this._mysql = require('mysql');
		this._connection = this._mysql.createConnection({
			host: host,
			user: user,
			database: database,
			password: password,
			timezone: '+00:00',
			charset: charset
		});
		this._onDisconnect();
		this._connection.connect();
	}
	
	escape(name) {
		return this._connection.escape(name);
	}
}
var MySQL = exports.MySQL = new _MySQL();


class SQLHandler extends Handler {
	
	doPrepare(data) {
		var result = {};

		if (!data || !('statement' in data)) {
			throw new Error('SQLHandler "' + this.url + '" has no statement.');
		}
		else {
			result.statement = data.statement;			
		}
		if (!data.values) {
			result.values = [];
		}
		else {
			result.values = data.values;
		}
		return result;
	}
	
	doResult(result) {
		return result;
	}
	
	doRequest() {
		try {
			var handler = this, behavior = handler.behavior;
			if (behavior && 'onConstruct' in behavior) {
				var data = handler.doPrepare(behavior.onConstruct(handler, handler.model, handler.query));
				MySQL._connection.query(data.statement, data.values, function (error, result) {
					try {
						if (!error)
							handler.result = handler.doResult(result);
						else
							handler.doError(new Error('SQL "' + data.statement + '" ' + error));
						handler.synchronize();
					}
					catch (e) {
						_webkool.application.reportError(handler, e);
					}
				});
			}
			else
				throw new Error('SQLHandler "' + handler.url + '" has no statement.');
		}
		catch (e) {
			_webkool.application.reportError(handler, e);
		}
	}
}
exports.SQLHandler = SQLHandler;

class SQLCountHandler extends SQLHandler {
	doResult(result) {
		if (result.length) {
			var row = result[0];
			for (var field in row) {
				return parseInt(row[field], 10);
			}
		}
	}
}
exports.SQLCountHandler = SQLCountHandler;


class SQLDeleteHandler extends SQLHandler {
	doPrepare(data) {
		var property = [], values = [], query = this.query, result = {};
		if (!('table' in data)) {
			throw new Error('SQLDeleteHandler "' + this.url + '" has no table name.');
		}
		for (var i = 0; i < data.columns.length; i++) {
			var column = data.columns[i];
			if (query.hasOwnProperty(column)) {
				property.push("`" + column + "` = ?");
				values.push(query[column]);
			}
		}
		if (property.length) {
			result.statement = "DELETE FROM " + data.table + " WHERE " + property.join(" AND ");
			result.values = values;
			if (query.extra) {
				result.statement += " " + query.extra;
			}
		}
		else if (query.all) {
			result.statement = "DELETE FROM " + data.table;
			result.values = undefined;
			if (query.extra) {
				result.statement += " " + query.extra;
			}
		}
		else {
			throw new Error('SQLDeleteHandler "' + this.url + '" has where clause.');
		}
		return result;
	}
}
exports.SQLDeleteHandler = SQLDeleteHandler;


class SQLFirstHandler extends SQLHandler {
	doResult(result) {
		if (result.length)
			return result[0];
	}
}
exports.SQLFirstHandler = SQLFirstHandler;


class SQLInsertHandler extends SQLHandler {
	doPrepare(data) {
		var property = [], items = [], values = [], query = this.query, result = {};

		if (!('table' in data)) {
			throw new Error('SQLInsertHandler "' + this.url + '" has no table name.');
		}
		if (!('columns' in data)) {
			throw new Error('SQLInsertHandler "' + this.url + '" has no columns.');
		}
		for (var i = 0; i < data.columns.length; i++) {
			var column = data.columns[i];
			if (query.hasOwnProperty(column)) {
				property.push("`" + column + "`");
				items.push('?');
				values.push(query[column]);
			}
		}
		result.statement = "INSERT INTO " + data.table + " (" + property.join(", ") + ") VALUES (" + items.join(", ") + ")";
		result.values = values;
		if (query.extra) {
			result.statement += " " + query.extra;
		}
		return result;
	}
	
	doResult(result) {
		return result.insertId;
	}
}
exports.SQLInsertHandler = SQLInsertHandler;

class SQLInsertIgnoreHandler extends SQLHandler {
	doPrepare(data) {
		var property = [], items = [], values = [], query = this.query, result = {};

		if (!('table' in data)) {
			throw new Error('SQLInsertHandler "' + this.url + '" has no table name.');
		}
		if (!('columns' in data)) {
			throw new Error('SQLInsertHandler "' + this.url + '" has no columns.');
		}
		for (var i = 0; i < data.columns.length; i++) {
			var column = data.columns[i];
			if (query.hasOwnProperty(column)) {
				property.push("`" + column + "`");
				items.push('?');
				values.push(query[column]);
			}
		}
		result.statement = "INSERT IGNORE INTO " + data.table + " (" + property.join(", ") + ") VALUES (" + items.join(", ") + ")";
		result.values = values;
		if (query.extra) {
			result.statement += " " + query.extra;
		}
		return result;
	}
	
	doResult(result) {
		return result.insertId;
	}
}
exports.SQLInsertIgnoreHandler = SQLInsertIgnoreHandler;

class SQLSelectHandler extends SQLHandler {
	doPrepare(data) {
		var property = [], values = [], query = this.query, result = {};

		if (!('table' in data)) {
			throw new Error('SQLSelectHandler "' + this.url + '" has no table name.');
		}
		if (!('columns' in data)) {
			throw new Error('SQLSelectHandler "' + this.url + '" has no columns.');
		}
		for (var i = 0; i < data.columns.length; i++) {
			var column = data.columns[i];
			if (query.hasOwnProperty(column)) {
				property.push("`" + column + "` = ?");
				values.push(query[column]);
			}
		}
		if (property.length) {
			result.statement = "SELECT * FROM " + data.table + " WHERE " + property.join(" AND ");
			result.values = values;
		}
		else {
			result.statement = "SELECT * FROM " + data.table;
		}
		if (query.extra) {
			result.statement += " " + query.extra;
		}
		return result;
	}
}
exports.SQLSelectHandler = SQLSelectHandler;


class SQLSelectFirstHandler extends SQLSelectHandler {
	doResult(result) {
		if (result.length)
		return result[0];
	}
}
exports.SQLSelectFirstHandler = SQLSelectFirstHandler;


class SQLSelectCountHandler extends SQLCountHandler {
	doPrepare(data) {
		var property = [], values = [], query = this.query, result = {};

		if (!('table' in data)) {
			throw new Error('SQLSelectHandler "' + this.url + '" has no table name.');
		}
		if (!('columns' in data)) {
			throw new Error('SQLSelectHandler "' + this.url + '" has no columns.');
		}
		for (var i = 0; i < data.columns.length; i++) {
			var column = data.columns[i];
			if (query.hasOwnProperty(column)) {
				property.push("`" + column + "` = ?");
				values.push(query[column]);
			}
		}
		if (property.length) {
			result.statement = "SELECT COUNT(*) FROM " + data.table + " WHERE " + property.join(" AND ");
			result.values = values;
		}
		else {
			result.statement = "SELECT COUNT(*) FROM " + data.table;
		}
		if (query.extra) {
			result.statement += " " + query.extra;
		}
		return result;
	}
}
exports.SQLSelectCountHandler = SQLSelectCountHandler;


class SQLUpdateHandler extends SQLHandler {
	doPrepare(data) {
		var property = [], values = [], query = this.query, result = {};

		if (!('table' in data)) {
			throw new Error('SQLUpdateHandler "' + this.url + '" has no table name.');
		}
		if (!('columns' in data)) {
			throw new Error('SQLUpdateHandler "' + this.url + '" has no columns.');
		}
		if (!('id' in query)) {
			throw new Error('SQLUpdateHandler "' + this.url + '" has no id.');
		}
		for (var i = 0; i < data.columns.length; i++) {
			var column = data.columns[i];
			if (column != 'id' && query.hasOwnProperty(column)) {
				property.push("`" + column + "` = ?");
				values.push(query[column]);
			}
		}
		values.push(query.id);
		result.statement = "UPDATE " + data.table + " SET " + property.join(", ") + " WHERE id = ?";
		result.values = values;
		if (query.extra) {
			result.statement += " " + query.extra;
		}
		return result;
	}
}
exports.SQLUpdateHandler = SQLUpdateHandler;
