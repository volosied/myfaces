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
import { Crypto, Hash } from "./Messaging";
/**
 * basic json stringify encryption impl
 * this does not really full encryption except for a standard json stringyfywith an encapsulation json
 *
 * the return value resembles:
 * <pre>
 *     {
 *         encryptedData: <data as string>
 *     }
 * </pre>
 */
export declare class JSONCrypto implements Crypto {
    decode(data: any): any;
    encode(data: any): {
        encryptedData: string;
    };
}
/**
 * a class with  timeout functionality which blocks decodes after a certain period of time
 * if the message is not decoded by then
 * We use hash as identifier generation after encryption to make sure
 * a trace was possible
 *
 * The idea behind this is to have a generic wrapper which allows messages with dynamic encryption
 * where keys/salts only exist for a certain period of time before expiring!
 * That way someone who implements such a scheme does not have to take care about the bookeeping mechanisms!
 * Or you can use crypto mechanisms which do not have expiring keys and still expire them automatically
 *
 * I will leave it up to the system integrator to provide a rotating crypto class, because this is highly
 * implementation dependent. But it helps to have a wrapper!
 */
export declare class ExpiringCrypto implements Crypto {
    private timeout;
    private parentCrypto;
    private hashSum;
    private static MAX_GC_CYCLES;
    private gcCycleCnt;
    private storedMessages;
    private lastCall;
    /**
     * @param timeout timeout in miliseconds until a message is expired
     * @param parentCrypto the embedded decorated crypto algorithm
     * @param hashSum hashshum implementation to generate a hash
     */
    constructor(timeout: number, parentCrypto: Crypto, hashSum: Hash);
    /**
     * decode implementation with a timeout hook install
     * @param data
     */
    decode(data: any): any;
    /**
     * trigger function to determine whether the gc needs to cycle again, this is either time or call based
     * the gc itself collects only on expiration dates
     * The idea is to run this operation only occasionally because it is costly
     * We also could have used timeouts etc.. but those would need shutdown/destroy cleanups
     *
     * @param currTime
     * @private
     */
    private gcLimitReached;
    /**
     * encode with a timeout hook installed
     * calls the encode of the delegated object
     *
     * @param data
     */
    encode(data: any): any;
}
