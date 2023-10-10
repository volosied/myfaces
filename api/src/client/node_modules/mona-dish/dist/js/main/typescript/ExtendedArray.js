"use strict";
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
exports.ExtendedArray = void 0;
/*!
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/**
 * Array with a set of shim functions for older browsers
 * we do not extend prototype (rule #1)
 *
 * This is a helper which for now adds the missing flatMap, without prototype pollution
 *
 * that way we can avoid streams wherever we just want to go pure JS
 * This class is self isolated, so it suffices to just dump it into a project one way or the other
 * without anything else
 */
var ExtendedArray = /** @class */ (function (_super) {
    __extends(ExtendedArray, _super);
    function ExtendedArray() {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        var _this = _super.apply(this, __spreadArray([], __read(items), false)) || this;
        //es5 base class see //fix for es5 deficit from https://github.com/Microsoft/TypeScript/issues/13720
        //for testing it definitely runs into this branch because we are on es5 level
        if (!Array.prototype.flatMap) {
            var flatmapFun = ExtendedArray.prototype.flatMap;
            //unfortunately in es5 the flaptmap function is lost due to inheritance of a primitive
            //es  class, we have to remap it back in
            _this.flatMap = flatmapFun;
        }
        return _this;
    }
    ExtendedArray.prototype.flatMap = function (mapperFunction, noFallback) {
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
        return new (ExtendedArray.bind.apply(ExtendedArray, __spreadArray([void 0], __read(res), false)))();
    };
    return ExtendedArray;
}(Array));
exports.ExtendedArray = ExtendedArray;
//# sourceMappingURL=ExtendedArray.js.map