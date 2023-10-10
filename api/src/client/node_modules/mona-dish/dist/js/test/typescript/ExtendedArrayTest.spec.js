/*
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
import { describe } from "mocha";
import { expect } from "chai";
import { _Es2019Array, Es2019Array } from "../../main/typescript/Es2019Array";
describe('Extended tests', function () {
    let arr;
    it("must handle flatmap correctly", () => {
        arr = new _Es2019Array(...["10", "20", "30", ["40", "50"], "60"]);
        let retArr = arr.flatMap(item => item);
        expect(retArr.length).to.eq(6);
    });
    it("must handle deeply nested items correctly", () => {
        arr = new _Es2019Array(...["10", "20", "30", ["40", "50", ["55", "56"]], "60"]);
        let retArr = arr.flatMap((item => item), true).flatMap(item => item);
        //second nesting level cannot be flatmapped, flatmap only works on one level usually
        //TODO this needs further investigation
        expect(retArr.length).to.eq(8);
    });
    it("must keep the order", () => {
        arr = new _Es2019Array(...["10", "20", "30", ["40", "50", ["55", "56"]], "60"]);
        let retArr = arr.flatMap((item => item), true).flatMap((item => item), true);
        expect(retArr.length).to.eq(8);
        let result = new Es2019Array(...["10", "20", "30", "40", "50", ["55", "56"], "60"]).flatMap(item => item);
        retArr.forEach((item, pos) => {
            expect(item).to.eq(result[pos]);
        });
    });
    it("must flatten properly", () => {
        arr = new _Es2019Array(...[[[1, 2]], [[3, 4]], [[5, 6]]]);
        let flattened = arr.flatMap(item => item);
        expect(flattened[0][0]).to.eq(1);
        expect(flattened[2][1]).to.eq(6);
        flattened = arr.flat(3);
        expect(flattened[0]).to.eq(1);
        expect(flattened[5]).to.eq(6);
    });
    // test had a failing use case in myfaces
    it('must map-filter-reduce correctly', () => {
        const arr = new _Es2019Array(...[1]);
        expect(arr[0]).to.eq(1);
        const res1 = [1].map(item => item + 1);
        const res3 = arr.map(item => item + 1);
        expect(res1[0]).to.eq(2);
        expect(res3[0]).to.eq(2);
        const res = arr.map(item => item + 1)
            .filter(item => !isNaN(item))
            .reduce((item1, item2) => Math.max(item1, item2), -1);
        expect(res).to.eq(2);
    });
    it("must handle flatmap correctly", () => {
        arr = new Es2019Array(...["10", "20", "30", ["40", "50"], "60"]);
        let retArr = arr.flatMap(item => item);
        expect(retArr.length).to.eq(6);
    });
    it("must handle deeply nested items correctly", () => {
        arr = new Es2019Array(...["10", "20", "30", ["40", "50", ["55", "56"]], "60"]);
        let retArr = arr.flatMap((item => item), true).flatMap(item => item);
        //second nesting level cannot be flatmapped, flatmap only works on one level usually
        //TODO this needs further investigation
        expect(retArr.length).to.eq(8);
    });
    it("must keep the order", () => {
        arr = new Es2019Array(...["10", "20", "30", ["40", "50", ["55", "56"]], "60"]);
        let retArr = arr.flatMap((item => item), true).flatMap((item => item), true);
        expect(retArr.length).to.eq(8);
        let result = new Es2019Array(...["10", "20", "30", "40", "50", ["55", "56"], "60"]).flatMap(item => item);
        retArr.forEach((item, pos) => {
            expect(item).to.eq(result[pos]);
        });
    });
    it("must flatten properly", () => {
        arr = new Es2019Array(...[[[1, 2]], [[3, 4]], [[5, 6]]]);
        let flattened = arr.flatMap(item => item);
        expect(flattened[0][0]).to.eq(1);
        expect(flattened[2][1]).to.eq(6);
        flattened = arr.flat(3);
        expect(flattened[0]).to.eq(1);
        expect(flattened[5]).to.eq(6);
    });
    // test had a failing use case in myfaces
    it('must map-filter-reduce correctly', () => {
        const arr = new Es2019Array().concat(...[1]);
        expect(arr[0]).to.eq(1);
        const res1 = [1].map(item => item + 1);
        const res3 = arr.map(item => item + 1);
        expect(res1[0]).to.eq(2);
        expect(res3[0]).to.eq(2);
        const res = arr.map(item => item + 1)
            .filter(item => !isNaN(item))
            .reduce((item1, item2) => Math.max(item1, item2), -1);
        expect(res).to.eq(2);
    });
});
//# sourceMappingURL=ExtendedArrayTest.spec.js.map