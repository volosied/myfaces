/**
 * Extended array
 */
/**
 * Extended array which adds various es 2019 shim functions to the normal array
 * We must remap all array producing functions in order to keep
 * the delegation active, once we are in!
 */
class Es2019Array_ extends Array {
    constructor(...another) {
        super(...another);
        if (another._another) {
            this._another = another._another;
        }
        else {
            this._another = another;
        }
        //for testing it definitely runs into this branch because we are on es5 level
        //if (!(<any>Array.prototype).flatMap) {
        this.flatMap = (flatMapFun) => this._flatMap(flatMapFun);
        //}
        //if (!(<any>Array.prototype).flat) {
        this.flat = (flatLevel = 1) => this._flat(flatLevel);
        //}
    }
    map(callbackfn, thisArg) {
        const ret = Array.prototype.map.call(this._another, callbackfn, thisArg);
        return new _Es2019Array(...ret);
    }
    concat(...items) {
        const ret = Array.prototype.concat.call(this._another, ...items);
        return new _Es2019Array(...ret);
    }
    reverse() {
        const ret = Array.prototype.reverse.call(this._another);
        return new _Es2019Array(...ret);
    }
    slice(start, end) {
        const ret = Array.prototype.slice.call(this._another, start, end);
        return new _Es2019Array(...ret);
    }
    splice(start, deleteCount) {
        const ret = Array.prototype.splice.call(this._another, start, deleteCount);
        return new _Es2019Array(...ret);
    }
    filter(predicate, thisArg) {
        const ret = Array.prototype.filter.call(this._another, predicate, thisArg);
        return new _Es2019Array(...ret);
    }
    reduce(callbackfn, initialValue) {
        const ret = Array.prototype.reduce.call(this._another, callbackfn, initialValue);
        return ret;
    }
    /*reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue: T): T {
        const ret = Array.prototype.reduceRight.call(callbackfn, initialValue);
        return ret;
    }*/
    _flat(flatDepth = 1) {
        return this._flatResolve(this._another, flatDepth);
    }
    _flatResolve(arr, flatDepth = 1) {
        //recursion break
        if (flatDepth == 0) {
            return arr;
        }
        let res = [];
        let reFlat = item => {
            item = Array.isArray(item) ? item : [item];
            let mapped = this._flatResolve(item, flatDepth - 1);
            res = res.concat(mapped);
        };
        arr.forEach(reFlat);
        return new Es2019Array(...res);
    }
    _flatMap(mapperFunction) {
        let res = this.map(item => mapperFunction(item));
        return this._flatResolve(res);
    }
}
//let _Es2019Array = function<T>(...data: T[]) {};
//let oldProto = Es2019Array.prototype;
export function _Es2019Array(...data) {
    let ret = new Es2019Array_(...data);
    let proxied = new Proxy(ret, {
        get(target, p, receiver) {
            if ("symbol" == typeof p) {
                return target._another[p];
            }
            if (!isNaN(parseInt(p))) {
                return target._another[p];
            }
            else {
                return target[p];
            }
        },
        set(target, property, value) {
            target[property] = value;
            target._another[property] = value;
            return true;
        }
    });
    return proxied;
}
;
/**
 * this is the switch between normal array and our shim
 * the shim is only provided in case the native browser
 * does not yet have flatMap support on arrays
 */
export var Es2019Array = (Array.prototype.flatMap) ? function (...data) {
    // sometimes the typescript compiler produces
    // an array without flatmap between boundaries (the result produces True for Array.isArray
    // but has no flatMap function, could be a node issue also or Typescript!
    // we remap that (could be related to: https://github.com/microsoft/TypeScript/issues/31033
    // the check and remap fixes the issue which should not exist in the first place
    return (data === null || data === void 0 ? void 0 : data.flatMap) ? data : _Es2019Array(...data);
} : _Es2019Array;
//# sourceMappingURL=Es2019Array.js.map