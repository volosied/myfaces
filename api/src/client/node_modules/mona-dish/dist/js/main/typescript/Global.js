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
 * various environments handle the global variable different
 * we have to deal with this.
 */
export function _global$() {
    var _a;
    let _global$ = ('undefined' != typeof globalThis && globalThis.window) ? globalThis.window :
        ('undefined' != typeof window) ? window :
            ('undefined' != typeof globalThis) ? globalThis :
                ('undefined' != typeof global && (global === null || global === void 0 ? void 0 : global.window)) ? global.window :
                    ('undefined' != typeof global) ? global : null;
    //under test systems we often have a lazy init of the window object under global.window, but we
    //want the window object
    return (_a = _global$ === null || _global$ === void 0 ? void 0 : _global$.window) !== null && _a !== void 0 ? _a : _global$;
}
//# sourceMappingURL=Global.js.map