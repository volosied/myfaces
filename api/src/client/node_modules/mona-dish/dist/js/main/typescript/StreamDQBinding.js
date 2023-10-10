/**
 * this is another indirection layer
 * to add binding to stream and DomQuery
 * which should not be in the core codebase
 * (This can reduce for instance DomQuery code
 * which does not need the Streams=
 */
import { LazyStream, Stream } from "./Stream";
import { DomQuery as _DQ } from "./DomQuery";
export class DomQuery extends _DQ {
    /**
     * binding into stream
     *
     */
    get stream() {
        const arrData = this.asArray;
        return Stream.of(...arrData);
    }
    /**
     * fetches a lazy stream representation
     * lazy should be applied if you have some filters etc.
     * in between, this can reduce the number of post filter operations
     * and ram usage
     * significantly because the operations are done lazily and stop
     * once they hit a dead end.
     */
    get lazyStream() {
        return LazyStream.of(...this.asArray);
    }
    static querySelectorAll(selector) {
        return new DomQuery(..._DQ.querySelectorAll(selector).asNodeArray);
    }
}
export const DQ$ = _DQ.querySelectorAll;
export const DQ = DomQuery;
export class DomQueryCollector {
    constructor() {
        this.data = [];
    }
    collect(element) {
        this.data.push(element);
    }
    get finalValue() {
        return new DomQuery(...this.data);
    }
}
//# sourceMappingURL=StreamDQBinding.js.map