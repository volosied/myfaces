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
import { Optional } from "./Monad";
export var PromiseStatus;
(function (PromiseStatus) {
    PromiseStatus[PromiseStatus["PENDING"] = 0] = "PENDING";
    PromiseStatus[PromiseStatus["FULLFILLED"] = 1] = "FULLFILLED";
    PromiseStatus[PromiseStatus["REJECTED"] = 2] = "REJECTED";
})(PromiseStatus || (PromiseStatus = {}));
/*
 * Promise wrappers for timeout and interval
 */
export function timeout(timeout) {
    let handler = null;
    return new CancellablePromise((apply, reject) => {
        handler = setTimeout(() => apply(), timeout);
    }, () => {
        if (handler) {
            clearTimeout(handler);
            handler = null;
        }
    });
}
export function interval(timeout) {
    let handler = null;
    return new CancellablePromise((apply, reject) => {
        handler = setInterval(() => {
            apply();
        }, timeout);
    }, () => {
        if (handler) {
            clearInterval(handler);
            handler = null;
        }
    });
}
/**
 * a small (probably not 100% correct, although I tried to be correct as possible) Promise implementation
 * for systems which do not have a promise implemented
 * Note, although an internal state is kept, this is sideffect free since
 * is value is a function to operate on, hence no real state is kept internally, except for the then
 * and catch calling order
 */
export class Promise {
    constructor(executor) {
        this.status = PromiseStatus.PENDING;
        this.allFuncs = [];
        //super(executor);
        this.value = executor;
        this.value((data) => this.resolve(data), (data) => this.reject(data));
    }
    static all(...promises) {
        let promiseCnt = 0;
        let myapply;
        let myPromise = new Promise((apply, reject) => {
            myapply = apply;
        });
        let executor = () => {
            promiseCnt++;
            if (promises.length == promiseCnt) {
                myapply();
            }
        };
        executor.__last__ = true;
        for (let cnt = 0; cnt < promises.length; cnt++) {
            promises[cnt].finally(executor);
        }
        return myPromise;
    }
    static race(...promises) {
        let promiseCnt = 0;
        let myapply;
        let myreject;
        let myPromise = new Promise((apply, reject) => {
            myapply = apply;
            myreject = reject;
        });
        let thenexecutor = () => {
            if (!!myapply) {
                myapply();
            }
            myapply = null;
            myreject = null;
            return null;
        };
        thenexecutor.__last__ = true;
        let catchexeutor = () => {
            if (!!myreject) {
                myreject();
            }
            myreject = null;
            myapply = null;
            return null;
        };
        catchexeutor.__last__ = true;
        for (let cnt = 0; cnt < promises.length; cnt++) {
            promises[cnt].then(thenexecutor);
            promises[cnt].catch(catchexeutor);
        }
        return myPromise;
    }
    static reject(reason) {
        let retVal = new Promise((resolve, reject) => {
            //not really doable without a hack
            if (reason instanceof Promise) {
                reason.then((val) => {
                    reject(val);
                });
            }
            else {
                setTimeout(() => {
                    reject(reason);
                }, 1);
            }
        });
        return retVal;
    }
    static resolve(reason) {
        let retVal = new Promise((resolve, reject) => {
            //not really doable without a hack
            if (reason instanceof Promise) {
                reason.then((val) => resolve(val));
            }
            else {
                setTimeout(() => {
                    resolve(reason);
                }, 1);
            }
        });
        return retVal;
    }
    then(executorFunc, catchfunc) {
        this.allFuncs.push({ "then": executorFunc });
        if (catchfunc) {
            this.allFuncs.push({ "catch": catchfunc });
        }
        this.spliceLastFuncs();
        return this;
    }
    catch(executorFunc) {
        this.allFuncs.push({ "catch": executorFunc });
        this.spliceLastFuncs();
        return this;
    }
    finally(executorFunc) {
        if (this.__reason__) {
            this.__reason__.finally(executorFunc);
            return;
        }
        this.allFuncs.push({ "finally": executorFunc });
        this.spliceLastFuncs();
        return this;
    }
    resolve(val) {
        while (this.allFuncs.length) {
            if (!this.allFuncs[0].then) {
                break;
            }
            let fn = this.allFuncs.shift();
            let funcResult = Optional.fromNullable(fn.then(val));
            if (funcResult.isPresent()) {
                funcResult = funcResult.flatMap();
                val = funcResult.value;
                if (val instanceof Promise) {
                    //let func = (newVal: any) => {this.resolve(newVal)};
                    //func.__last__  = true;
                    //val.then(func);
                    this.transferIntoNewPromise(val);
                    return;
                }
            }
            else {
                break;
            }
        }
        this.appyFinally();
        this.status = PromiseStatus.FULLFILLED;
    }
    reject(val) {
        while (this.allFuncs.length) {
            if (this.allFuncs[0].finally) {
                break;
            }
            let fn = this.allFuncs.shift();
            if (fn.catch) {
                let funcResult = Optional.fromNullable(fn.catch(val));
                if (funcResult.isPresent()) {
                    funcResult = funcResult.flatMap();
                    val = funcResult.value;
                    if (val instanceof Promise) {
                        //val.then((newVal: any) => {this.resolve(newVal)});
                        this.transferIntoNewPromise(val);
                        return;
                    }
                    this.status = PromiseStatus.REJECTED;
                    break;
                }
                else {
                    break;
                }
            }
        }
        this.status = PromiseStatus.REJECTED;
        this.appyFinally();
    }
    appyFinally() {
        while (this.allFuncs.length) {
            let fn = this.allFuncs.shift();
            if (fn.finally) {
                fn.finally();
            }
        }
    }
    spliceLastFuncs() {
        let lastFuncs = [];
        let rest = [];
        for (let cnt = 0; cnt < this.allFuncs.length; cnt++) {
            for (let key in this.allFuncs[cnt]) {
                if (this.allFuncs[cnt][key].__last__) {
                    lastFuncs.push(this.allFuncs[cnt]);
                }
                else {
                    rest.push(this.allFuncs[cnt]);
                }
            }
        }
        this.allFuncs = rest.concat(lastFuncs);
    }
    transferIntoNewPromise(val) {
        for (let cnt = 0; cnt < this.allFuncs.length; cnt++) {
            for (let key in this.allFuncs[cnt]) {
                val[key](this.allFuncs[cnt][key]);
            }
        }
    }
}
/**
 * a cancellable promise
 * a Promise with a cancel function, which can be cancellend any time
 * this is useful for promises which use cancellable asynchronous operations
 * note, even in a cancel state, the finally of the promise is executed, however
 * subsequent thens are not anymore.
 * The current then however is fished or a catch is called depending on how the outer
 * operation reacts to a cancel order.
 */
export class CancellablePromise extends Promise {
    /**
     * @param executor asynchronous callback operation which triggers the callback
     * @param cancellator cancel operation, separate from the trigger operation
     */
    constructor(executor, cancellator) {
        super(executor);
        this.cancellator = () => {
        };
        this.cancellator = cancellator;
    }
    cancel() {
        this.status = PromiseStatus.REJECTED;
        this.appyFinally();
        //lets terminate it once and for all, the finally has been applied
        this.allFuncs = [];
    }
    then(executorFunc, catchfunc) {
        return super.then(executorFunc, catchfunc);
    }
    catch(executorFunc) {
        return super.catch(executorFunc);
    }
    finally(executorFunc) {
        return super.finally(executorFunc);
    }
}
//# sourceMappingURL=Promise.js.map