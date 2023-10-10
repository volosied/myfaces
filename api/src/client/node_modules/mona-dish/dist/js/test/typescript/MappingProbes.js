/* Licensed to the Apache Software Foundation (ASF) under one or more
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
class ArrType {
    constructor(clazz) {
        this.clazz = clazz;
    }
}
class DtoUils {
    static mapIt(target, src, mappings) {
        for (let key in src) {
            if (!src.hasOwnProperty(key)) {
                continue;
            }
            let newVal = src[key];
            if (mappings[key] &&
                mappings[key] instanceof ArrType) {
                //do the array here
                target[key] = {};
                for (let key2 in newVal) {
                    let subTarget = new mappings[key].clazz(newVal[key2]);
                    //   subTarget = this.mapIt(subTarget, <any> newVal[key2]);
                    target[key][key2] = subTarget;
                }
            }
            else if (mappings && mappings[key]) {
                let subTarget = new mappings[key](newVal);
                target[key] = subTarget;
            }
            else {
                target[key] = newVal;
            }
        }
        return target;
    }
}
class BaseDto {
    constructor(data, dtoTypes = {}) {
        this.TYPES = "___mappable_types___";
        this[this.TYPES] = dtoTypes;
        if (data) {
            this.mapIt(this, data);
        }
    }
    mapIt(target, src) {
        for (let key in src) {
            if (!src.hasOwnProperty(key)) {
                continue;
            }
            let newVal = src[key];
            if (target[this.TYPES] &&
                target[this.TYPES][key] &&
                target[this.TYPES][key] instanceof ArrType) {
                //do the array here
                target[key] = {};
                for (let key2 in newVal) {
                    let subTarget = new target[this.TYPES][key].clazz(newVal[key2]);
                    //   subTarget = this.mapIt(subTarget, <any> newVal[key2]);
                    target[key][key2] = subTarget;
                }
            }
            else if (target[this.TYPES] && target[this.TYPES][key]) {
                let subTarget = new target[this.TYPES][key](newVal);
                target[key] = subTarget;
            }
            else {
                target[key] = newVal;
            }
        }
        return target;
    }
}
export class Probe2Impl {
    constructor(data) {
        this.val1 = data.val1;
    }
}
function mixMaps(target, src) {
    for (let key in src) {
        target[key] = src[key];
    }
    return target;
}
export class Probe1Impl {
    constructor(data, mixin = {} /*put your own arguments in here*/) {
        DtoUils.mapIt(this, data, mixMaps({
            val3: new ArrType(Probe2Impl),
            val4: new ArrType(Probe2Impl),
            val5: Probe2Impl
        }, mixin));
    }
}
//# sourceMappingURL=MappingProbes.js.map