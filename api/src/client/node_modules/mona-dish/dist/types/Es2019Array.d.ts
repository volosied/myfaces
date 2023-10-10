/**
 * Extended array
 */
/**
 * Extended array which adds various es 2019 shim functions to the normal array
 * We must remap all array producing functions in order to keep
 * the delegation active, once we are in!
 */
declare class Es2019Array_<T> extends Array<T> {
    _another: T[];
    constructor(...another: T[]);
    map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
    concat(...items: any[]): T[];
    reverse(): T[];
    slice(start?: number, end?: number): T[];
    splice(start: number, deleteCount?: number): T[];
    filter<S extends T>(predicate: (value: T, index: number, array: T[]) => any, thisArg?: any): S[];
    reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue?: T): T;
    private _flat;
    private _flatResolve;
    private _flatMap;
}
export declare function _Es2019Array<T>(...data: T[]): Es2019Array_<T>;
/**
 * this is the switch between normal array and our shim
 * the shim is only provided in case the native browser
 * does not yet have flatMap support on arrays
 */
export declare var Es2019Array: any;
export {};
