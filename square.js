"use strict";

// import {application} from "./webkool";
var _webkool = require("./webkool");

var json = function(data) {
	return JSON.stringify(data, null, 4);
};

function	include(url,scope) {
	return _webkool.application.render(url, scope);
}


var squareArgs = ['json','include'];
var squareValues = [json, include];


class Block {

  constructor(container) {
    this.container = container;
    this.contents = [];
  }

  prepare(buffer) {
    var contents = this.contents, c = contents.length, i;
    for (i = 0; i < c; i += 1) {
      contents[i].prepare(buffer);
    }
  }

  render(scope, args, values) {
    var contents = this.contents, length = contents.length, result = "";
    for (var i = 0; i < length; i += 1) {
      result += contents[i].render(scope, args, values);
    }
    return result;
  }
}

class Text {

  constructor(container, offset) {
    this.container = container;
    this.start = offset;
    this.stop = offset;
    this.buffer = null;
  }

  prepare(buffer) {
    this.buffer = buffer.substring(this.start, this.stop);
  }

  render(scope, args, values) {
    return (this.buffer) ? this.buffer : "";
  }
}

class Variable {

  constructor(container, start, stop, path, line) {
    this.container = container;
    this.start = start;
    this.stop = stop;
    this.path = path;
    this.line = line;
    this.contents = [];
    this.script = null;
  }

  prepare(buffer) {
    this.script = buffer.substring(this.start, this.stop);
    this.script = this.script.replace(/\\"/g, '"');
    var contents = this.contents, c = contents.length, i;
    for (i = 0; i < c; i += 1) {
      contents[i].prepare(buffer);
    }
  }

  render(scope, args, values) {
    try {
      var blocks = this.contents;
      switch (blocks.length) {
        case 0: {
            let f = Function.apply(undefined, args.concat('return (' + this.script + ');'));
            return f.apply(undefined, values);
        }
        break;

        case 1: {
          let f = Function.apply(undefined, args.concat('return (' + this.script + ');'));
          if (f.apply(undefined, values)) {
            return blocks[0].render(scope, args, values);
          }
          else {
            return "";
          }
        }
        break;

        case 2:
          let f = Function.apply(undefined, args.concat('return (' + this.script + ');'));
          if (f.apply(undefined, values)) {
            return blocks[0].render(scope, args, values);
          }
          else {
            return blocks[1].render(scope, args, values);
          }
        break;

        case 3: {
          let f = Function.apply(undefined, args.concat('return (' + this.script + ');'));
          var $$ = f.apply(undefined, values);
          var $c = $$.length;
          var result = blocks[0].render(scope, args, values);
          for (var $i = 0; $i < $c; $i += 1) {
            var $ = $$[$i];
            result += blocks[1].render(scope, args.concat(['$', '$i', '$c', '$$']), values.concat([$, $i, $c, $$]));
          }
          result += blocks[2].render(scope, args, values);
          return result;
        }
        break;
      }
    }
    catch(e) {
      console.log("# Square failed '" + this.script + "' : " + e.toString());
      return "";
    }
  }
}

class Square {

  constructor(buffer, path) {
    this.contents = [];
    this.currentBlock = this;
    this.currentText = null;
    this.line = 1;
    this.path = path;
    this.parse(buffer);
    this.prepare(buffer);
  }

  parse(buffer) {
    var c, head, tail, offset = 0, former, start, stop;
    this.startText(offset);
    while (c = buffer.charCodeAt(offset)) {
      switch (c) {
      case 10:
        this.line += 1;
        offset += 1;
        break;
      case 13:
        this.line += 1;
        offset += 1;
        c = buffer.charCodeAt(offset);
        if (c == 10)
          offset += 1;
        break;
      case 35: // #
        former = offset;
        offset += 1;
        start = offset;
        c = buffer.charCodeAt(offset);
        if (c == 123) { // {
          offset += 1;
          start = offset;
          for (;;) {
            c = buffer.charCodeAt(offset);
            if (c == 10) {
              this.line += 1;
              offset += 1;
            }
            else if (c == 13) {
              this.line += 1;
              offset += 1;
              c = buffer.charCodeAt(offset);
              if (c == 10)
                offset += 1;
            }
            else if ((c == 125) && ((buffer.charCodeAt(offset+1)==35) || (buffer.charCodeAt(offset+1)==91))) // }# }[
              break;
            else
              offset += 1;
          }
          stop = offset;
          offset += 1;
          c = buffer.charCodeAt(offset);
        }
        else {
          for (;;) {
            c = buffer.charCodeAt(offset);
            if (((48 <= c) && (c <= 57)) || ((65 <= c) && (c <= 90)) || ((97 <= c) && (c <= 122)) || (c == 36) || (c == 95) || (c == 46))
              offset += 1;
            else
              break;
          }
          stop = offset;
        }
        if (c == 35) { // #
          this.stopText(former);
          if (start == stop)
            this.reportError('missing variable');
          else {
            this.pushVariable(start, stop);
            this.popVariable();
          }
          offset += 1;
          this.startText(offset);
        }
        else if (c == 91) { // [
          this.stopText(former);
          if (start == stop)
            this.reportError('missing id');
          else {
            this.pushVariable(start, stop);
            this.pushBlock();
          }
          offset += 1;
          this.startText(offset);
        }
        break;
      case 93: // ]
        former = offset;
        offset += 1;
        c = buffer.charCodeAt(offset);
        if (c == 35) { // #
          this.stopText(former);
          this.popBlock();
          this.popVariable();
          offset += 1;
          this.startText(offset);
        }
        else if (c == 91) { // [
          this.stopText(former);
          this.popBlock();
          this.pushBlock();
          offset += 1;
          this.startText(offset);
        }
        break;
      case 60: // <
        former = offset;
        head = buffer.toString(null, offset, offset + 9);
        if (head.indexOf('<![CDATA[') == 0) {
          head = buffer.toString(null, offset + 9);
          tail = head.indexOf(']]>');
          if (tail >= 0)
            former = offset + 9 + tail + 3;
          else
            this.reportError('missing ]]>');
        }
        else if (head.indexOf('<!--') == 0) {
          head = buffer.toString(null, offset + 4);
          tail = head.indexOf('-->');
          if (tail >= 0)
            former = offset + 4 + tail + 3;
          else
            this.reportError('missing -->');
        }
        offset += 1;
        while (offset < former) {
          c = buffer.charCodeAt(offset);
          switch (c) {
          case 10:
            this.line += 1;
            offset += 1;
            break;
          case 13:
            this.line += 1;
            offset += 1;
            c = buffer.charCodeAt(offset);
            if (c == 10)
              offset += 1;
            break;
          default:
            offset += 1;
            break;
          }
        }
        break;
      default:
        offset += 1;
        break;

      }
    }
    this.stopText(offset);
  }

  popBlock() {
    if (this.currentBlock.container) {
      this.currentBlock = this.currentBlock.container;
    }
    else
      this.reportError('unexpected ]');
  }

  popVariable() {
    if (this.currentBlock.container) {
      this.currentBlock = this.currentBlock.container;
    }
    else
      this.reportError('unexpected ]]');
  }

  prepare(buffer) {
    var contents = this.contents, c = contents.length, i;
    for (i = 0; i < c; i += 1) {
      contents[i].prepare(buffer);
    }
  }

  pushBlock() {
    var block = new Block(this.currentBlock);
    this.currentBlock.contents.push(block);
    this.currentBlock = block;
  }

  pushVariable(start, stop) {
    var variable = new Variable(this.currentBlock, start, stop, this.path, this.line);
    this.currentBlock.contents.push(variable);
    this.currentBlock = variable;
  }

  reportError(message) {
    console.log(this.path + ':' + this.line + ': error:' + message);
  }

  startText(offset) {
    var text = new Text(this.currentBlock, offset);
    this.currentBlock.contents.push(text);
    this.currentText = text;
  }

  stopText(offset) {
    if (this.currentText.start < offset)
      this.currentText.stop = offset;
    else
      this.currentBlock.contents.pop();
    this.currentText = null;
  }

  render(scope, args, values) {
    var contents = this.contents, length = contents.length;
    var result = "";
    for (var i = 0; i < length; i += 1) {
      result += contents[i].render(scope, args, values);
    }
    return result;
  }
}

function square(parts/*, ...args*/) {
  /* Compatibility */
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  /* Compatibility */

  var square = new Square(parts[0], "");
  return function(handler, scope) {
    var args = squareArgs.concat('scope'), values = squareValues.concat(scope);
    for (var s in scope) {
      args.push(s);
      values.push(scope[s]);
    }
    return square.render(scope, args, values);
  };
};
exports.square = square;

function squareExtends(arg, value) {
  squareArgs.push(arg);
  squareValues.push(value);
}
exports.squareExtends = squareExtends;
