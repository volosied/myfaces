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
exports.Es2019Array = void 0;
/**
 * Extended array which adds various es 2019 shim functions to the normal array
 * We must remap all array producing functions in order to keep
 * the delegation active, once we are in!
 */
var Es2019Array = /** @class */ (function (_super) {
    __extends(Es2019Array, _super);
    function Es2019Array() {
        var another = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            another[_i] = arguments[_i];
        }
        var _this = _super.apply(this, __spreadArray([], __read(another), false)) || this;
        //for testing it definitely runs into this branch because we are on es5 level
        if (!Array.prototype.flatMap) {
            var flatmapFun = Es2019Array.prototype.flatMap_;
            //unfortunately in es5 the flatMap function is lost due to inheritance of a primitive
            //es  class, we have to remap it back in
            _this.flatMap = flatmapFun;
        }
        return _this;
    }
    Es2019Array.prototype.flatMap_ = function (mapperFunction, noFallback) {
        if (noFallback === void 0) { noFallback = false; }
        var res = [];
        var remap = function (item) {
            var opRes = mapperFunction(item);
            if (Array.isArray(opRes)) {
                if (opRes.length == 1) {
                    res.push(opRes[1]);
                    return;
                }
                if (opRes.length > 1) {
                    opRes.forEach(function (newItem) { return remap(newItem); });
                }
            }
            else {
                res.push(item);
            }
        };
        this.forEach(function (item) { return remap(item); });
        return new (Es2019Array.bind.apply(Es2019Array, __spreadArray([void 0], __read(res), false)))();
    };
    Es2019Array.prototype.concat = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        return new (Es2019Array.bind.apply(Es2019Array, __spreadArray([void 0], __read(_super.prototype.concat.apply(this, __spreadArray([], __read(items), false))), false)))();
    };
    Es2019Array.prototype.reverse = function () {
        return new (Es2019Array.bind.apply(Es2019Array, __spreadArray([void 0], __read(_super.prototype.reverse.call(this)), false)))();
    };
    Es2019Array.prototype.slice = function (start, end) {
        return new (Es2019Array.bind.apply(Es2019Array, __spreadArray([void 0], __read(_super.prototype.slice.call(this, start, end)), false)))();
    };
    Es2019Array.prototype.splice = function (start, deleteCount) {
        return new (Es2019Array.bind.apply(Es2019Array, __spreadArray([void 0], __read(_super.prototype.splice.call(this, start, deleteCount)), false)))();
    };
    Es2019Array.prototype.filter = function (predicate, thisArg) {
        return new (Es2019Array.bind.apply(Es2019Array, __spreadArray([void 0], __read(_super.prototype.filter.call(this, predicate, thisArg)), false)))();
    };
    return Es2019Array;
}(Array));
exports.Es2019Array = Es2019Array;
//# sourceMappingURL=Ex2019Array.js.map