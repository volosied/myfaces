"use strict";
/**
 * Extended array
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtArray = void 0;
/**
 * Extended array which adds various es 2019 shim functions to the normal array
 * We must remap all array producing functions in order to keep
 * the delegation active, once we are in!
 */
var ExtArray = /** @class */ (function (_super) {
    __extends(ExtArray, _super);
    function ExtArray() {
        var another = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            another[_i] = arguments[_i];
        }
        var _this = _super.apply(this, __spreadArray([], __read(another), false)) || this;
        _this.initShim();
        return _this;
    }
    ExtArray.prototype.initShim = function () {
        var ts = this;
        if (!ts.flatMap) {
            ts.flatMap = function (flatmapFunc) {
                var res = [];
                for (var cnt = 0; cnt <= ts.length; cnt++) {
                    var item = flatmapFunc(ts[cnt]);
                    if (Array.isArray(item)) {
                        res = res.concat.apply(res, __spreadArray([], __read(item), false));
                    }
                    else {
                        res.push(item);
                    }
                }
                return res;
            };
        }
        else {
            var oldFlatmap_1 = ts.flatMap;
            ts.flatMap = function (flatmapFunc) {
                var res = oldFlatmap_1.call(ts, flatmapFunc);
                return new (ExtArray.bind.apply(ExtArray, __spreadArray([void 0], __read(res), false)))();
            };
        }
    };
    ExtArray.prototype.concat = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        return new (ExtArray.bind.apply(ExtArray, __spreadArray([void 0], __read(_super.prototype.concat.apply(this, __spreadArray([], __read(items), false))), false)))();
    };
    ExtArray.prototype.reverse = function () {
        return new (ExtArray.bind.apply(ExtArray, __spreadArray([void 0], __read(_super.prototype.reverse.call(this)), false)))();
    };
    ExtArray.prototype.slice = function (start, end) {
        return new (ExtArray.bind.apply(ExtArray, __spreadArray([void 0], __read(_super.prototype.slice.call(this, start, end)), false)))();
    };
    ExtArray.prototype.splice = function (start, deleteCount) {
        return new (ExtArray.bind.apply(ExtArray, __spreadArray([void 0], __read(_super.prototype.splice.call(this, start, deleteCount)), false)))();
    };
    ExtArray.prototype.filter = function (predicate, thisArg) {
        return new (ExtArray.bind.apply(ExtArray, __spreadArray([void 0], __read(_super.prototype.filter.call(this, predicate, thisArg)), false)))();
    };
    return ExtArray;
}(Array));
exports.ExtArray = ExtArray;
//# sourceMappingURL=ExtArray.js.map