export declare enum PromiseStatus {
    PENDING = 0,
    FULLFILLED = 1,
    REJECTED = 2
}
export interface IPromise {
    then(executorFunc: (val: any) => any): IPromise;
    catch(executorFunc: (val: any) => any): IPromise;
    finally(executorFunc: () => void): IPromise;
}
export declare function timeout(timeout: number): CancellablePromise;
export declare function interval(timeout: number): CancellablePromise;
/**
 * a small (probably not 100% correct, although I tried to be correct as possible) Promise implementation
 * for systems which do not have a promise implemented
 * Note, although an internal state is kept, this is sideffect free since
 * is value is a function to operate on, hence no real state is kept internally, except for the then
 * and catch calling order
 */
export declare class Promise implements IPromise {
    status: PromiseStatus;
    protected allFuncs: Array<any>;
    private value;
    constructor(executor: (resolve: (val?: any) => void, reject: (val?: any) => void) => void);
    static all(...promises: Array<IPromise>): IPromise;
    static race(...promises: Array<IPromise>): IPromise;
    static reject(reason: any): Promise;
    static resolve(reason: any): Promise;
    then(executorFunc: (val?: any) => any, catchfunc?: (val?: any) => any): Promise;
    catch(executorFunc: (val?: any) => void): Promise;
    finally(executorFunc: () => void): Promise;
    protected resolve(val?: any): void;
    protected reject(val?: any): void;
    protected appyFinally(): void;
    private spliceLastFuncs;
    private transferIntoNewPromise;
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
export declare class CancellablePromise extends Promise {
    /**
     * @param executor asynchronous callback operation which triggers the callback
     * @param cancellator cancel operation, separate from the trigger operation
     */
    constructor(executor: (resolve: (val?: any) => void, reject: (val?: any) => void) => void, cancellator: () => void);
    cancel(): void;
    then(executorFunc: (val?: any) => any, catchfunc?: (val?: any) => any): CancellablePromise;
    catch(executorFunc: (val?: any) => void): CancellablePromise;
    finally(executorFunc: () => void): CancellablePromise;
    private cancellator;
}
