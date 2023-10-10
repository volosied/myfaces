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
import { Config } from "./Config";
/**
 * special status of the datasource location pointer
 * if an access, outside - of the possible data boundaries is happening
 * (example for instance current without a first next call, or next
 * which goes over the last possible dataset), an iteration status return
 * value is returned marking this boundary instead of a classical element
 *
 * Note this is only internally used but must be implemented to fulfill
 * internal contracts, the end user will never see those values if he uses
 * streams!
 */
export var ITERATION_STATUS;
(function (ITERATION_STATUS) {
    ITERATION_STATUS["EO_STRM"] = "__EO_STRM__";
    ITERATION_STATUS["BEF_STRM"] = "___BEF_STRM__";
})(ITERATION_STATUS || (ITERATION_STATUS = {}));
export function calculateSkips(next_strm) {
    let pos = 1;
    while (next_strm.lookAhead(pos) != ITERATION_STATUS.EO_STRM) {
        pos++;
    }
    return --pos;
}
/**
 * A data source which combines multiple streams sequentially into one
 * (this is used internally by  flatmap, but also can be used externally)
 */
export class MultiStreamDatasource {
    constructor(first, ...strms) {
        this.first = first;
        this.selectedPos = 0;
        this.strms = [first].concat(...strms);
        this.activeStrm = this.strms[this.selectedPos];
    }
    current() {
        return this.activeStrm.current();
    }
    hasNext() {
        if (this.activeStrm.hasNext()) {
            return true;
        }
        if (this.selectedPos >= this.strms.length) {
            return false;
        }
        return this.findNextStrm() != -1;
    }
    findNextStrm() {
        let hasNext = false;
        let cnt = this.selectedPos;
        while (!hasNext && cnt < this.strms.length) {
            hasNext = this.strms[cnt].hasNext();
            if (!hasNext) {
                cnt++;
            }
        }
        return hasNext ? cnt : -1;
    }
    lookAhead(cnt = 1) {
        //lets clone
        const strms = this.strms.slice(this.selectedPos);
        if (!strms.length) {
            return ITERATION_STATUS.EO_STRM;
        }
        const all_strms = [...strms];
        while (all_strms.length) {
            let next_strm = all_strms.shift();
            let lookAhead = next_strm.lookAhead(cnt);
            if (lookAhead != ITERATION_STATUS.EO_STRM) {
                return lookAhead;
            }
            cnt = cnt - calculateSkips(next_strm);
        }
        return ITERATION_STATUS.EO_STRM;
    }
    next() {
        if (this.activeStrm.hasNext()) {
            return this.activeStrm.next();
        }
        this.selectedPos = this.findNextStrm();
        if (this.selectedPos == -1) {
            return ITERATION_STATUS.EO_STRM;
        }
        this.activeStrm = this.strms[this.selectedPos];
        return this.activeStrm.next();
    }
    reset() {
        this.activeStrm = this.strms[0];
        this.selectedPos = 0;
        for (let cnt = 0; cnt < this.strms.length; cnt++) {
            this.strms[cnt].reset();
        }
    }
}
/**
 * defines a sequence of numbers for our stream input
 */
export class SequenceDataSource {
    constructor(start, total) {
        this.total = total;
        this.start = start;
        this.value = start - 1;
    }
    hasNext() {
        return this.value < (this.total - 1);
    }
    next() {
        this.value++;
        return this.value <= (this.total - 1) ? this.value : ITERATION_STATUS.EO_STRM;
    }
    lookAhead(cnt = 1) {
        if ((this.value + cnt) > this.total - 1) {
            return ITERATION_STATUS.EO_STRM;
        }
        else {
            return this.value + cnt;
        }
    }
    reset() {
        this.value = this.start - 1;
    }
    current() {
        //first condition current without initial call for next
        return (this.start - 1) ? ITERATION_STATUS.BEF_STRM : this.value;
    }
}
/**
 * implementation of a datasource on top of a standard array
 */
export class ArrayStreamDataSource {
    constructor(...value) {
        this.dataPos = -1;
        this.value = value;
    }
    lookAhead(cnt = 1) {
        if ((this.dataPos + cnt) > this.value.length - 1) {
            return ITERATION_STATUS.EO_STRM;
        }
        return this.value[this.dataPos + cnt];
    }
    hasNext() {
        return this.value.length - 1 > this.dataPos;
    }
    next() {
        var _a;
        this.dataPos++;
        return (_a = this === null || this === void 0 ? void 0 : this.value[this.dataPos]) !== null && _a !== void 0 ? _a : ITERATION_STATUS.EO_STRM;
    }
    reset() {
        this.dataPos = -1;
    }
    current() {
        return this.value[Math.max(0, this.dataPos)];
    }
}
/**
 * an intermediate data source which prefilters
 * incoming stream data
 * and lets only the data out which
 * passes the filter function check
 */
export class FilteredStreamDatasource {
    constructor(filterFunc, parent) {
        this._current = ITERATION_STATUS.BEF_STRM;
        // we have to add a filter idx because the external filter values might change over time, so
        // we cannot reset the state properly unless we do it from a snapshot
        this._filterIdx = {};
        this._unfilteredPos = 0;
        this.filterFunc = filterFunc;
        this.inputDataSource = parent;
    }
    /**
     * in order to filter we have to make a look ahead until the
     * first next allowed element
     * hence we prefetch the element and then
     * serve it via next
     */
    hasNext() {
        let steps = 1;
        let found = false;
        let next;
        while (!found && (next = this.inputDataSource.lookAhead(steps)) != ITERATION_STATUS.EO_STRM) {
            if (this.filterFunc(next)) {
                this._filterIdx[this._unfilteredPos + steps] = true;
                found = true;
            }
            else {
                steps++;
            }
        }
        return found;
    }
    /**
     * serve the next element
     */
    next() {
        var _a, _b;
        let found = ITERATION_STATUS.EO_STRM;
        while (this.inputDataSource.hasNext()) {
            this._unfilteredPos++;
            let next = this.inputDataSource.next();
            //again here we cannot call the filter function twice, because its state might change, so if indexed, we have a decent snapshot, either has next or next can trigger
            //the snapshot
            if (next != ITERATION_STATUS.EO_STRM &&
                (((_b = (_a = this._filterIdx) === null || _a === void 0 ? void 0 : _a[this._unfilteredPos]) !== null && _b !== void 0 ? _b : false) || this.filterFunc(next))) {
                this._filterIdx[this._unfilteredPos] = true;
                found = next;
                break;
            }
        }
        this._current = found;
        return found;
    }
    /**
     * looks ahead cnt without changing the internal data "pointers" of the data source
     * (this is mostly needed by LazyStreams, because they do not know by definition their
     * boundaries)
     *
     * @param cnt the elements to look ahead
     * @return either the element or ITERATION_STATUS.EO_STRM if we hit the end of the stream before
     * finding the "cnt" element
     */
    lookAhead(cnt = 1) {
        var _a;
        let lookupVal;
        for (let loop = 1; cnt > 0 && (lookupVal = this.inputDataSource.lookAhead(loop)) != ITERATION_STATUS.EO_STRM; loop++) {
            let inCache = (_a = this._filterIdx) === null || _a === void 0 ? void 0 : _a[this._unfilteredPos + loop];
            if (inCache || this.filterFunc(lookupVal)) {
                cnt--;
                this._filterIdx[this._unfilteredPos + loop] = true;
            }
        }
        return lookupVal;
    }
    current() {
        return this._current;
    }
    reset() {
        this._current = ITERATION_STATUS.BEF_STRM;
        this._filterIdx = {};
        this._unfilteredPos = 0;
        this.inputDataSource.reset();
    }
}
/**
 * an intermediate datasource which maps the items from
 * one into another
 */
export class MappedStreamDataSource {
    constructor(mapFunc, parent) {
        this.mapFunc = mapFunc;
        this.inputDataSource = parent;
    }
    hasNext() {
        return this.inputDataSource.hasNext();
    }
    next() {
        return this.mapFunc(this.inputDataSource.next());
    }
    reset() {
        this.inputDataSource.reset();
    }
    current() {
        return this.mapFunc(this.inputDataSource.current());
    }
    lookAhead(cnt = 1) {
        const lookAheadVal = this.inputDataSource.lookAhead(cnt);
        return (lookAheadVal == ITERATION_STATUS.EO_STRM) ? lookAheadVal : this.mapFunc(lookAheadVal);
    }
}
/**
 * For the time being we only need one collector
 * a collector which collects a stream back into arrays
 */
export class ShimArrayCollector {
    constructor() {
        this.data = new Es2019Array(...[]);
    }
    collect(element) {
        this.data.push(element);
    }
    get finalValue() {
        return this.data;
    }
}
/**
 * collects the values as inverse array
 */
export class InverseArrayCollector {
    constructor() {
        this.data = [];
    }
    collect(element) {
        this.data.unshift(element);
    }
    get finalValue() {
        return this.data;
    }
}
/**
 * collects an tuple array stream into an assoc array with elements being collected into arrays
 *
 */
export class ArrayAssocArrayCollector {
    constructor() {
        this.finalValue = {};
    }
    collect(element) {
        var _a, _b, _c, _d;
        let key = (_a = element === null || element === void 0 ? void 0 : element[0]) !== null && _a !== void 0 ? _a : element;
        this.finalValue[key] = (_c = (_b = this.finalValue) === null || _b === void 0 ? void 0 : _b[key]) !== null && _c !== void 0 ? _c : [];
        this.finalValue[key].push((_d = element === null || element === void 0 ? void 0 : element[1]) !== null && _d !== void 0 ? _d : true);
    }
}
/**
 * dummy collector which just triggers a run
 * on lazy streams without collecting anything
 */
export class Run {
    collect(element) {
    }
    get finalValue() {
        return null;
    }
}
/**
 * collects an assoc stream back to an assoc array
 */
export class AssocArrayCollector {
    constructor() {
        this.finalValue = {};
    }
    collect(element) {
        var _a, _b;
        this.finalValue[(_a = element[0]) !== null && _a !== void 0 ? _a : element] = (_b = element[1]) !== null && _b !== void 0 ? _b : true;
    }
}
/**
 * A Config collector similar to the FormDFata Collector
 */
export class ConfigCollector {
    constructor() {
        this.finalValue = new Config({});
    }
    collect(element) {
        this.finalValue.append(element.key).value = element.value;
    }
}
/**
 * Form data collector for key value pair streams
 */
export class FormDataCollector {
    constructor() {
        this.finalValue = new FormData();
    }
    collect(element) {
        this.finalValue.append(element.key, element.value);
    }
}
/**
 * Form data collector for DomQuery streams
 */
export class QueryFormDataCollector {
    constructor() {
        this.finalValue = new FormData();
    }
    collect(element) {
        let toMerge = element.encodeFormElement();
        if (toMerge.isPresent()) {
            this.finalValue.append(element.name.value, toMerge.get(element.name).value);
        }
    }
}
/**
 * Encoded String collector from dom query streams
 */
export class QueryFormStringCollector {
    constructor() {
        this.formData = [];
    }
    collect(element) {
        let toMerge = element.encodeFormElement();
        if (toMerge.isPresent()) {
            this.formData.push([element.name.value, toMerge.get(element.name).value]);
        }
    }
    get finalValue() {
        return new Es2019Array(...this.formData)
            .map(keyVal => keyVal.join("="))
            .reduce((item1, item2) => [item1, item2].join("&"));
    }
}
/**
 * For the time being we only need one collector
 * a collector which collects a stream back into arrays
 */
export class ArrayCollector {
    constructor() {
        this.data = [];
    }
    collect(element) {
        this.data.push(element);
    }
    get finalValue() {
        return this.data;
    }
}
//# sourceMappingURL=SourcesCollectors.js.map