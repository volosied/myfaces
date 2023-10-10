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
/**
 * a standardized message to be sent over the message bus
 */
import { Observable, Subject } from "rxjs";
/**
 * generic crypto interface
 * to encrypt messages before they are sent
 * to the message bus oder the underlying bus system
 *
 * The idea is to make it as easy as possible, you can use for instance crypto js to
 * handle everything
 */
export interface Crypto {
    /**
     * note anything can be passed
     *
     * @param data the data to be encrypted
     * @returns the encrypted data in any format, important is decode must be able to handle it
     */
    encode(data: any): any;
    /**
     * @param data the encrypted data in the format you expect it to be
     * @returns the unencrypted data
     */
    decode(data: any): any;
}
/**
 * generic hash interface which provides
 * exactly one method a hash encode which returns a string hash value of encoded data
 */
export interface Hash {
    encode(encodedData: string): string;
}
/**
 * Default implementation = no encryption
 */
export declare class NoCrypto implements Crypto {
    decode(data: any): string;
    encode(data: any): any;
}
export declare class Message {
    message: any;
    creationDate?: number;
    identifier?: string;
    targetOrigin?: string;
    encoded: boolean;
    constructor(message?: any, targetOrigin?: string);
}
/**
 * abstract broker class
 * (The broker is the central distribution unit of messages)
 */
declare abstract class BaseBroker {
    static readonly EVENT_TYPE = "brokerEvent";
    /**
     * we can split the listeners with the system
     * namespace... and type (aka identifier criteria)
     */
    protected messageListeners: any;
    protected subjects: any;
    protected processedMessages: any;
    protected cleanupCnt: number;
    protected rootElem: any;
    protected msgHandler: any;
    protected readonly TIMEOUT_IN_MS = 1000;
    protected readonly MSG_EVENT = "message";
    crypto: NoCrypto;
    abstract register(scopeElement?: any): BaseBroker;
    abstract unregister(): BaseBroker;
    abstract broadcast(channel: string, message: Message | string): BaseBroker;
    /**
     * registers a listener on a channel
     * @param channel the channel to register the listeners for
     * @param listener the listener to register
     */
    registerListener(channel: string, listener: (msg: Message) => void): BaseBroker;
    /**
     * binding into rxjs
     * produces a subject which can be used via next calls to send messages
     * on the other hand we
     * @param channel
     */
    asSubject(channel: string): Subject<Message>;
    /**
     * returns an observable on the baseBroker
     * @param channel
     */
    asObservable(channel: string): Observable<Message>;
    /**
     * reserves the listener namespace and wildcard namespace for the given identifier
     * @param identifier
     * @private
     */
    private reserveListenerNS;
    private reserveSubjectNS;
    /**
     * unregisters a listener from this channel
     *
     * @param channel the channel to unregister from
     * @param listener the listener to unregister the channel from
     */
    unregisterListener(channel: string, listener: (msg: Message) => void): BaseBroker;
    /**
     * answers a bidirectional message received
     * usage, the client can use this method, to answer an incoming message in a precise manner
     * so that the caller sending the bidirectional message knows how to deal with it
     * this mechanism can be used for global storages where we have one answering entity per channel delivering the
     * requested data, the request can be done asynchronously via promises waiting for answers
     *
     * @param channel the channel the originating message
     * @param request the requesting message
     * @param answer the answer to the request
     */
    answer(channel: string, request: Message | string, answer: Message): BaseBroker;
    private static getAnswerId;
    private static isAnswer;
    /**
     * idea... a bidirectional broadcast
     * sends a message and waits for the first answer coming in from one of the receivers
     * sending the message back with a messageIdentifier_broadCastId answer
     *
     * @param channel
     * @param message
     */
    request(channel: string, message: Message | string): Promise<Message>;
    /**
     * garbage collects the processed messages queue
     * usually after one second
     */
    protected gcProcessedMessages(): void;
    private messageStillActive;
    protected markMessageAsProcessed(message: Message): void;
}
/**
 * a broker which hooks into the Broadcast Channel
 * either via shim or substitute lib
 *
 * The broadcast channels are a standardized messaging library
 * The broker mechanism sets a layer on top to make it more manageable!
 *
 */
export declare class BroadcastChannelBroker extends BaseBroker {
    private brokerFactory;
    private channelGroup;
    crypto: Crypto;
    private openChannels;
    private readonly msgListener;
    /**
     * @param brokerFactory a factory generating a broker
     * @param channelGroup a group to combine a set of channels
     * @param crypto a crypto class
     */
    constructor(brokerFactory?: Function, channelGroup?: string, crypto?: Crypto);
    broadcast(channel: string, message: Message | string, includeOrigin?: boolean): BaseBroker;
    registerListener(channel: string, listener: (msg: Message) => void): BaseBroker;
    register(): BaseBroker;
    unregister(): BaseBroker;
}
/**
 * Helper factory to create a broadcast channel broker
 */
export declare class BroadcastChannelBrokerBuilder {
    private broadCastChannelGenerator;
    private channelGroup;
    private crypto;
    private listeners;
    withGeneratorFunc(generatorFunc: Function): BroadcastChannelBrokerBuilder;
    withListener(channel: string, ...listeners: Function[]): BroadcastChannelBrokerBuilder;
    withChannelGroup(channelGroup: string): BroadcastChannelBrokerBuilder;
    withCrypto(crypto: Crypto): BroadcastChannelBrokerBuilder;
    build(): BroadcastChannelBroker;
}
/**
 * implementation of a messaging based transport
 */
/**
 * central message broker which uses various dom constructs
 * to broadcast messages into subelements
 *
 * we use the dom event system as transport and iframe and shadow dom mechanisms in a transparent way to
 * pull this off
 *
 * usage
 *
 * broker = new Broker(optional rootElement)
 *
 * defines a message broker within a scope of rootElement (without it is window aka the current isolation level)
 *
 * broker.registerListener(channel, listener) registers a new listener to the current broker and channel
 * broker.unregisterListener(channel, listener) unregisters the given listener
 *
 * broker.broadcast(message, optional direction, optional callBrokerListeners)
 * sends a message (channel included in the message object) in a direction (up, down, both)
 * and also optionally calls the listeners on the same broker (default off)
 *
 * the flow is like
 * up messages are propagated upwards only until it reaches the outer top of the dom
 * downwards, the messages are propagated downwards only
 * both the message is propagated into both directions
 *
 * Usually messages sent from the same broker are not processed within... however by setting
 * callBrokerListeners to true the listeners on the same broker also are called
 * brokers on the same level will get the message and process it automatically no matter what.
 * That way you can exclude the source from message processing (and it is done that way automatically)
 *
 * Isolation levels. Usually every isolation level needs its own broker object registering
 * on the outer bounds
 *
 * aka documents will register on window
 * iframes on the iframe windowObject
 * isolated shadow doms... document
 *
 *
 *
 */
export declare class Broker extends BaseBroker {
    brokerGroup: string;
    /**
     * constructor has an optional root element
     * and an internal name
     *
     * @param scopeElement
     * @param brokerGroup
     * @param crypto
     */
    constructor(scopeElement?: HTMLElement | Window | ShadowRoot, brokerGroup?: string, crypto?: Crypto);
    /**
     * register the current broker into a scope defined by wnd
     * @param scopeElement
     */
    register(scopeElement: HTMLElement | Window | ShadowRoot): BaseBroker;
    /**
     * manual unregister function, to unregister as broker from the current
     * scope
     */
    unregister(): BaseBroker;
    /**
     * broadcast a message
     * the message contains the channel and the data and some internal bookkeeping data
     *
     * @param channel the channel to broadcast to
     * @param message the message dot send
     * (for instance 2 iframes within the same parent broker)
     */
    broadcast(channel: string, message: Message | string): BaseBroker;
    private dispatchUp;
    private dispatchSameLevel;
    private dispatchDown;
    private msgCallListeners;
    private transformToEvent;
    private static createCustomEvent;
}
/**
 * Helper factory to create a dom broker
 */
export declare class BrokerBuilder {
    private scopeElement;
    private channelGroup;
    private crypto;
    private listeners;
    withScopeElement(scopeElement: HTMLElement | Window | ShadowRoot): BrokerBuilder;
    withListener(channel: string, ...listeners: Function[]): BrokerBuilder;
    withChannelGroup(channelGroup: string): BrokerBuilder;
    withCrypto(crypto: Crypto): BrokerBuilder;
    build(): Broker;
}
export {};
