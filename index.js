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

var _webkool = require('./webkool');
exports.webkool = _webkool;

var _square = require('./square');
exports.square = _square;

var _S3Handler = require('./S3Handler');
exports.S3Handler = _S3Handler;

var _S3EventHandler = require('./S3EventHandler');
exports.S3EventHandler = _S3EventHandler;

var _SESHandler = require('./SESHandler');
exports.SESHandler = _SESHandler;

var _SNSHandler = require('./SNSHandler');
exports.SNSHandler = _SNSHandler;

var _MySQLHandler = require('./MySQLHandler');
exports.MySQLHandler = _MySQLHandler;
