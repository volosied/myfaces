/*!
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to you under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Optional } from "./Monad";
import { Es2019Array } from "./Es2019Array";
/**
 * Lang helpers crossported from the apache myfaces project
 */
export var Lang;
(function (Lang) {
    //should be in lang, but for now here to avoid recursive imports, not sure if typescript still has a problem with those
    /**
     * helper function to safely resolve anything
     * this is not an elvis operator, it resolves
     * a value without exception in a tree and if
     * it is not resolvable then an optional of
     * a default value is restored or Optional.empty
     * if none is given
     *
     * usage
     * <code>
     *     let var: Optiona<string> = saveResolve(() => a.b.c.d.e, "foobaz")
     * </code>
     *
     * @param resolverProducer a lambda which can produce the value
     * @param defaultValue an optional default value if the producer failes to produce anything
     * @returns an Optional of the produced value
     */
    function saveResolve(resolverProducer, defaultValue = null) {
        try {
            let result = resolverProducer();
            return Optional.fromNullable(result !== null && result !== void 0 ? result : defaultValue);
        }
        catch (e) {
            return Optional.absent;
        }
    }
    Lang.saveResolve = saveResolve;
    /**
     * lazy resolve... aka the function is called on resolve and a default value also
     * is a producing function (called only if the original producer does not produce any result)
     * @param resolverProducer the producer for the resolve
     * @param defaultValue the default value producer function
     */
    function saveResolveLazy(resolverProducer, defaultValue = null) {
        try {
            let result = resolverProducer();
            return Optional.fromNullable(result !== null && result !== void 0 ? result : defaultValue());
        }
        catch (e) {
            return Optional.absent;
        }
    }
    Lang.saveResolveLazy = saveResolveLazy;
    /**
     * String to array function performs a string to array transformation
     * @param {String} it the string which has to be changed into an array
     * @param {RegExp} splitter our splitter reglar expression
     * @return a trimmed array of the splitted string
     */
    function strToArray(it, splitter = /\./gi) {
        let ret = [];
        it.split(splitter).forEach((element => {
            ret.push(trim(element));
        }));
        return ret;
    }
    Lang.strToArray = strToArray;
    /**
     * hyperfast trim
     * http://blog.stevenlevithan.com/archives/faster-trim-javascript
     * crossported from dojo
     */
    function trim(str) {
        str = str.replace(/^\s\s*/, '');
        let ws = /\s/, i = str.length;
        while (ws.test(str.charAt(--i))) {
            //do nothing
        }
        return str.slice(0, i + 1);
    }
    Lang.trim = trim;
    /**
     * generic object arrays like dom definitions to array conversion method which
     * transforms any object to something array like
     * @param obj
     * @param offset
     * @param pack
     * @returns an array converted from the object
     */
    function objToArray(obj, offset = 0, pack = []) {
        if ((obj !== null && obj !== void 0 ? obj : "__undefined__") == "__undefined__") {
            return pack !== null && pack !== void 0 ? pack : null;
        }
        //since offset is numeric we cannot use the shortcut due to 0 being false
        //special condition array delivered no offset no pack
        if (obj instanceof Array && !offset && !pack)
            return obj;
        return new Es2019Array(...pack.concat(Array.prototype.slice.call(obj, offset)));
    }
    Lang.objToArray = objToArray;
    /**
     * equalsIgnoreCase, case-insensitive comparison of two strings
     *
     * @param source
     * @param destination
     */
    function equalsIgnoreCase(source, destination) {
        let finalSource = source !== null && source !== void 0 ? source : "___no_value__";
        let finalDest = destination !== null && destination !== void 0 ? destination : "___no_value__";
        //in any other case we do a strong string comparison
        return finalSource.toLowerCase() === finalDest.toLowerCase();
    }
    Lang.equalsIgnoreCase = equalsIgnoreCase;
    /**
     * runtime type assertion
     *
     * @param probe the probe to be tested for a type
     * @param theType the type to be tested for
     */
    function assertType(probe, theType) {
        return isString(theType) ? typeof probe == theType : probe instanceof theType;
    }
    Lang.assertType = assertType;
    /**
     * Back ported from Dojo
     * a failsafe string determination method
     * (since in javascript String != "" typeof alone fails!)
     * @param it {|Object|} the object to be checked for being a string
     * @return true in case of being a string false otherwise
     */
    function isString(it) {
        //	summary:
        //		Return true if it is a String
        return !!arguments.length && it != null && (typeof it == "string" || it instanceof String); // Boolean
    }
    Lang.isString = isString;
    /**
     * Back-ported, a failsafe determination code for checking whether an object is a function
     * @param it the object to check for being a function
     */
    function isFunc(it) {
        return it instanceof Function || typeof it === "function";
    }
    Lang.isFunc = isFunc;
    // code from https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    // license https://creativecommons.org/licenses/by-sa/2.5/
    function objAssign(target, ...theArgs) {
        if (target == null) { // TypeError if undefined or null
            throw new TypeError('Cannot convert undefined or null to object');
        }
        let to = Object(target);
        if (Object.assign) {
            theArgs.forEach(item => Object.assign(to, item));
            return to;
        }
        theArgs.filter(item => item != null).forEach(item => {
            let nextSource = item;
            Object.keys(nextSource)
                .filter(nextKey => Object.prototype.hasOwnProperty.call(nextSource, nextKey))
                .forEach(nextKey => to[nextKey] = nextSource[nextKey]);
        });
        return to;
    }
    Lang.objAssign = objAssign;
})(Lang || (Lang = {}));
//# sourceMappingURL=Lang.js.map