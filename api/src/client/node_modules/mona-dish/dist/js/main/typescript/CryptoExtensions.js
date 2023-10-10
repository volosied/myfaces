import { AssocArrayCollector } from "./SourcesCollectors";
import { LazyStream } from "./Stream";
/*
 * Some crypto implementations which might come in handy
 */
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
export class JSONCrypto {
    decode(data) {
        if (data === null || data === void 0 ? void 0 : data.encryptedData) {
            return JSON.parse(data.encryptedData);
        }
        return data;
    }
    encode(data) {
        return {
            encryptedData: JSON.stringify(data)
        };
    }
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
export class ExpiringCrypto {
    /**
     * @param timeout timeout in miliseconds until a message is expired
     * @param parentCrypto the embedded decorated crypto algorithm
     * @param hashSum hashshum implementation to generate a hash
     */
    constructor(timeout, parentCrypto, hashSum) {
        this.timeout = timeout;
        this.parentCrypto = parentCrypto;
        this.hashSum = hashSum;
        this.gcCycleCnt = 0;
        this.storedMessages = {};
        this.lastCall = 0;
    }
    /**
     * decode implementation with a timeout hook install
     * @param data
     */
    decode(data) {
        //if ((this.gcCycleCnt++ % ExpiringCrypto.MAX_GC_CYCLES) === 0) {
        var _a;
        const currTime = new Date().getTime();
        if (this.gcLimitReached(currTime)) {
            this.storedMessages = LazyStream
                .ofAssoc(this.storedMessages)
                .filter(data => data[1] >= currTime)
                .collect(new AssocArrayCollector());
        }
        this.lastCall = currTime;
        let rotatingEncoded = this.hashSum.encode(data);
        if (!((_a = this.storedMessages) === null || _a === void 0 ? void 0 : _a[rotatingEncoded.toString()])) {
            throw Error("An item was tried to be decryted which either was expired or invalid");
        }
        return this.parentCrypto.decode(data);
    }
    /**
     * trigger function to determine whether the gc needs to cycle again, this is either time or call based
     * the gc itself collects only on expiration dates
     * The idea is to run this operation only occasionally because it is costly
     * We also could have used timeouts etc.. but those would need shutdown/destroy cleanups
     *
     * @param currTime
     * @private
     */
    gcLimitReached(currTime) {
        return (this.lastCall + this.timeout) < currTime || ((++this.gcCycleCnt) % ExpiringCrypto.MAX_GC_CYCLES == 0);
    }
    /**
     * encode with a timeout hook installed
     * calls the encode of the delegated object
     *
     * @param data
     */
    encode(data) {
        let encoded = this.parentCrypto.encode(data);
        //ok use the hashsum really only to store expirations, theoretically there could be a second message which does not invalidate the first one
        //but this is very unlikely unless a message is sent over and over again, in this case we have a timeout extension anyway!
        let rotatingEncoded = this.hashSum.encode(encoded);
        this.storedMessages[rotatingEncoded.toString()] = (new Date().getTime()) + this.timeout;
        return encoded;
    }
}
ExpiringCrypto.MAX_GC_CYCLES = 10;
//# sourceMappingURL=CryptoExtensions.js.map