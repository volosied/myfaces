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
import { Es2019Array } from "./Es2019Array";
/**
 * Implementation of a monad
 * (Side - effect free), no write allowed directly on the monads
 * value state
 */
export class Monad {
    constructor(value) {
        this._value = value;
    }
    get value() {
        return this._value;
    }
    map(fn) {
        if (!fn) {
            fn = (inVal) => inVal;
        }
        let result = fn(this.value);
        return new Monad(result);
    }
    flatMap(fn) {
        let mapped = this.map(fn);
        while ((mapped === null || mapped === void 0 ? void 0 : mapped.value) instanceof Monad) {
            mapped = mapped.value;
        }
        return mapped;
    }
}
/**
 * optional implementation, an optional is basically an implementation of a Monad with additional syntactic
 * sugar on top
 * (Side - effect free, since value assignment is not allowed)
 * */
export class Optional extends Monad {
    constructor(value) {
        super(value);
    }
    get value() {
        if (this._value instanceof Monad) {
            return this._value.flatMap().value;
        }
        return this._value;
    }
    static fromNullable(value) {
        return new Optional(value);
    }
    /*syntactic sugar for absent and present checks*/
    isAbsent() {
        return "undefined" == typeof this.value || null == this.value;
    }
    /**
     * any value present
     */
    isPresent(presentRunnable) {
        let absent = this.isAbsent();
        if (!absent && presentRunnable) {
            presentRunnable.call(this, this);
        }
        return !absent;
    }
    ifPresentLazy(presentRunnable = () => {
    }) {
        this.isPresent.call(this, presentRunnable);
        return this;
    }
    orElse(elseValue) {
        if (this.isPresent()) {
            return this;
        }
        else {
            //shortcut
            if (elseValue == null) {
                return Optional.absent;
            }
            return this.flatMap(() => elseValue);
        }
    }
    /**
     * lazy, passes a function which then is lazily evaluated
     * instead of a direct value
     * @param func
     */
    orElseLazy(func) {
        if (this.isPresent()) {
            return this;
        }
        else {
            return this.flatMap(func);
        }
    }
    /*
     * we need to implement it to fulfill the contract, although it is used only internally
     * all values are flattened when accessed anyway, so there is no need to call this method
     */
    flatMap(fn) {
        let val = super.flatMap(fn);
        if (!(val instanceof Optional)) {
            return Optional.fromNullable(val.value);
        }
        return val.flatMap();
    }
    /*
     * elvis operation, take care, if you use this you lose typesafety and refactoring
     * capabilities, unfortunately typescript does not allow to have its own elvis operator
     * this is some syntactic sugar however which is quite useful*/
    getIf(...key) {
        key = this.preprocessKeys(...key);
        let currentPos = this;
        for (let cnt = 0; cnt < key.length; cnt++) {
            let currKey = this.keyVal(key[cnt]);
            let arrPos = this.arrayIndex(key[cnt]);
            if (currKey === "" && arrPos >= 0) {
                currentPos = this.getClass().fromNullable(!(currentPos.value instanceof Array) ? null : (currentPos.value.length < arrPos ? null : currentPos.value[arrPos]));
                if (currentPos.isAbsent()) {
                    return currentPos;
                }
                continue;
            }
            else if (currKey && arrPos >= 0) {
                if (currentPos.getIfPresent(currKey).isAbsent()) {
                    return currentPos;
                }
                currentPos = (currentPos.getIfPresent(currKey).value instanceof Array) ? this.getClass().fromNullable(currentPos.getIfPresent(currKey).value[arrPos]) : this.getClass().absent;
                if (currentPos.isAbsent()) {
                    return currentPos;
                }
                continue;
            }
            else {
                currentPos = currentPos.getIfPresent(currKey);
            }
            if (currentPos.isAbsent()) {
                return currentPos;
            }
            else if (arrPos > -1) {
                currentPos = this.getClass().fromNullable(currentPos.value[arrPos]);
            }
        }
        return currentPos;
    }
    /**
     * simple match, if the first order function call returns
     * true then there is a match, if the value is not present
     * it never matches
     *
     * @param fn the first order function performing the match
     */
    match(fn) {
        if (this.isAbsent()) {
            return false;
        }
        return fn(this.value);
    }
    /**
     * convenience function to flatmap the internal value
     * and replace it with a default in case of being absent
     *
     * @param defaultVal
     * @returns {Optional<any>}
     */
    get(defaultVal = Optional.absent) {
        if (this.isAbsent()) {
            return this.getClass().fromNullable(defaultVal).flatMap();
        }
        return this.getClass().fromNullable(this.value).flatMap();
    }
    toJson() {
        return JSON.stringify(this.value);
    }
    /**
     * helper to override several implementations in a more fluent way
     * by having a getClass operation we can avoid direct calls into the constructor or
     * static methods and do not have to implement several methods which rely on the type
     * of "this"
     * @returns the type of Optional
     */
    getClass() {
        return Optional;
    }
    /*helper method for getIf with array access aka <name>[<indexPos>]*/
    arrayIndex(key) {
        let start = key.indexOf("[");
        let end = key.indexOf("]");
        if (start >= 0 && end > 0 && start < end) {
            return parseInt(key.substring(start + 1, end));
        }
        else {
            return -1;
        }
    }
    /*helper method for getIf with array access aka <name>[<indexPos>]*/
    keyVal(key) {
        let start = key.indexOf("[");
        if (start >= 0) {
            return key.substring(0, start);
        }
        else {
            return key;
        }
    }
    /**
     * additional syntactic sugar which is not part of the usual optional implementation
     * but makes life easier, if you want to sacrifice typesafety and refactoring
     * capabilities in typescript
     */
    getIfPresent(key) {
        if (this.isAbsent()) {
            return this.getClass().absent;
        }
        return this.getClass().fromNullable(this.value[key]).flatMap();
    }
    /**
     * elvis like typesafe functional save resolver
     * a typesafe option for getIfPresent
     *
     * usage myOptional.resolve(value => value.subAttr.subAttr2).orElseLazy(....)
     * if this is resolvable without any errors an Optional with the value is returned
     * if not, then an Optional absent is returned, also if you return Optional absent
     * it is flatmapped into absent
     *
     * @param resolver the resolver function, can throw any arbitrary errors, int  the error case
     * the resolution goes towards absent
     */
    resolve(resolver) {
        if (this.isAbsent()) {
            return Optional.absent;
        }
        try {
            return Optional.fromNullable(resolver(this.value));
        }
        catch (e) {
            return Optional.absent;
        }
    }
    preprocessKeys(...keys) {
        return new Es2019Array(...keys)
            .flatMap(item => {
            return new Es2019Array(...item.split(/]\s*\[/gi))
                .map(item => {
                item = item.replace(/^\s+|\s+$/g, "");
                if (item.indexOf("[") == -1 && item.indexOf("]") != -1) {
                    item = "[" + item;
                }
                if (item.indexOf("]") == -1 && item.indexOf("[") != -1) {
                    item = item + "]";
                }
                return item;
            });
        });
    }
}
/*default value for absent*/
Optional.absent = Optional.fromNullable(null);
// --------------------- From here onwards we break out the side effect free limits ------------
/**
 * ValueEmbedder is the writeable version
 * of optional, it basically is a wrapper
 * around a construct which has a state
 * and can be written to.
 *
 * For the readonly version see Optional
 */
export class ValueEmbedder extends Optional {
    constructor(rootElem, valueKey = "value") {
        super(rootElem);
        this.key = valueKey;
    }
    get value() {
        return this._value ? this._value[this.key] : null;
    }
    set value(newVal) {
        if (!this._value) {
            return;
        }
        this._value[this.key] = newVal;
    }
    orElse(elseValue) {
        let alternative = {};
        alternative[this.key] = elseValue;
        return this.isPresent() ? this : new ValueEmbedder(alternative, this.key);
    }
    orElseLazy(func) {
        if (this.isPresent()) {
            return this;
        }
        else {
            let alternative = {};
            alternative[this.key] = func();
            return new ValueEmbedder(alternative, this.key);
        }
    }
    /**
     * helper to override several implementations in a more fluent way
     * by having a getClass operation we can avoid direct calls into the constructor or
     * static methods and do not have to implement several methods which rely on the type
     * of "this"
     * @returns ValueEmbedder
     */
    getClass() {
        return ValueEmbedder;
    }
    static fromNullable(value, valueKey = "value") {
        return new ValueEmbedder(value, valueKey);
    }
}
/*default value for absent*/
ValueEmbedder.absent = ValueEmbedder.fromNullable(null);
//# sourceMappingURL=Monad.js.map