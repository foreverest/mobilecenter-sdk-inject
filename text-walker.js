"use strict";
exports.__esModule = true;
var TextWalker = (function () {
    /**
     *
     */
    function TextWalker(text, _state, _position) {
        if (_position === void 0) { _position = 0; }
        this.text = text;
        this._state = _state;
        this._position = _position;
        this._traps = [];
    }
    Object.defineProperty(TextWalker.prototype, "position", {
        get: function () {
            return this._position;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextWalker.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    TextWalker.prototype.addTrap = function (checker, reaction) {
        this._traps.push(new TextWalkerTrap(this, checker, reaction));
    };
    TextWalker.prototype.step = function () {
        this._position++;
        if (this._position >= this.text.length)
            return false;
        this.checkTraps();
        return true;
    };
    TextWalker.prototype.walk = function () {
        while (this.step())
            ;
    };
    TextWalker.prototype.checkTraps = function () {
        this.traps.forEach(function (trap) { return trap.check(); });
    };
    Object.defineProperty(TextWalker.prototype, "back", {
        get: function () {
            return this.text.substr(0, this._position);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextWalker.prototype, "front", {
        get: function () {
            return this.text.substr(this._position);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextWalker.prototype, "currentChar", {
        get: function () {
            return this.text.substr(this._position, 1);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextWalker.prototype, "prevChar", {
        get: function () {
            return this.text.substr(this._position - 1, 1);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextWalker.prototype, "prevWord", {
        get: function () {
            return /\w+$/.exec(this.back)[0];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextWalker.prototype, "nextWord", {
        get: function () {
            return /^\w+/.exec(this.front)[0];
        },
        enumerable: true,
        configurable: true
    });
    return TextWalker;
}());
exports.TextWalker = TextWalker;
var TextWalkerTrap = (function () {
    /**
     *
     */
    function TextWalkerTrap(textWalker, checker, reaction) {
        this.textWalker = textWalker;
        this.checker = checker;
        this.reaction = reaction;
    }
    TextWalkerTrap.prototype.check = function () {
        var result = false;
        if (result = this.checker(this.textWalker)) {
            this.reaction(this.textWalker);
        }
        return result;
    };
    return TextWalkerTrap;
}());
exports.TextWalkerTrap = TextWalkerTrap;
