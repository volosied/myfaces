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

/**
 * An implementation of an xhr request object
 * with partial page submit functionality, and jsf
 * ppr request and timeout handling capabilities
 *
 * Author: Ganesh Jung (latest modification by $Author: ganeshpuri $)
 * Version: $Revision: 1.4 $ $Date: 2009/05/31 09:16:44 $
 */
/** @namespace myfaces._impl.xhrCore._AjaxRequest */
myfaces._impl.core._Runtime.extendClass("myfaces._impl.xhrCore._AjaxRequest", myfaces._impl.xhrCore._BaseRequest, {


    /*
    note there is a load of common properties
    inherited by the base class which define the corner
    parameters and the general internal behavior
    like _onError etc...
     */




    /**
     * Constructor
     * @arguments  an arguments map which an override any of the given protected
     * instance variables, by a simple name value pair combination
     *
     */
    constructor_: function(arguments) {
        try {

            /*namespace remapping for readability*/
            //we fetch in the standard arguments
            //and apply them to our protected attributes
            this._Lang.applyArgs(this, arguments);

            //if our response handler is not set
            if (!this._response) {
                this._response = new myfaces._impl.xhrCore._AjaxResponse(this._onException, this._onWarning);
            }
            this._ajaxUtil = new myfaces._impl.xhrCore._AjaxUtils(this._onException, this._onWarning);

            this._requestParameters = this.getViewState();

            for (var key in this._passThrough) {
                this._requestParameters = this._requestParameters +
                        "&" + encodeURIComponent(key) +
                        "=" + encodeURIComponent(this._passThrough[key]);
            }
        } catch (e) {
            //_onError
            this._onException(null, this._context, "myfaces._impl.xhrCore._AjaxRequest", "constructor", e);
        }
    },

    /**
     * Sends an Ajax request
     */
    send : function() {
        try {
            this._startXHR();
            this._startTimeout();
        } catch (e) {
            //_onError//_onError
            this._onException(this._xhr, this._context, "myfaces._impl.xhrCore._AjaxRequest", "send", e);
        }
    },

    /**
     * starts the asynchronous xhr request
     */
    _startXHR: function() {
        this._xhr = myfaces._impl.core._Runtime.getXHRObject();

        this._xhr.open(this._ajaxType, this._sourceForm.action, true);

        var contentType = this._contentType;
        if (this._encoding) {
            contentType = contentType + "; charset:" + this._encoding;
        }

        this._xhr.setRequestHeader(this._CONTENT_TYPE, this._contentType);
        this._xhr.setRequestHeader(this._HEAD_FACES_REQ, this._VAL_AJAX);

        this._xhr.onreadystatechange = this._Lang.hitch(this, this.callback);
        var _Impl = myfaces._impl.core._Runtime.getGlobalConfig("jsfAjaxImpl", myfaces._impl.core.Impl);
        _Impl.sendEvent(this._xhr, this._context, myfaces._impl.core.Impl.BEGIN);
        this._xhr.send(this._requestParameters);
    },

    /**
     * starts the timeout
     * which is able to terminate the xhr upfront early
     */
    _startTimeout: function() {
        if (this._timeout && this._onTimeout) {
            var _req = this._xhr;
            var _context = this._context;
            if(this._timeoutId) {
                window.clearTimeout(this._timeoutId);
                this._timeoutId = null;
            }
            this._timeoutId = window.setTimeout(
                //we unify the api, there must be always a request passed to the external function
                //and always a context, no matter what
                    this._Lang.hitch(this,
                            function() {
                                //the hitch has to be done due to the setTimeout refocusing the scope of this
                                //to window
                                try {
                                        _req.onreadystatechange = function() {};

                                       //to avoid malformed whatever, we have
                                       //the timeout covered already on the _onTimeout function
                                       _req.abort();
                                        this._onTimeout(_req, _context);
                                } catch (e) {
                                        alert(e);
                                } finally {
                                }
                            })
                    , this._timeout);
        }
    },
   
    /**
     * Callback method to process the Ajax response
     * triggered by RequestQueue
     */
    callback : function() {

        try {
            var _Impl = myfaces._impl.core._Runtime.getGlobalConfig("jsfAjaxImpl", myfaces._impl.core.Impl);

            if (this._xhr.readyState == this._READY_STATE_DONE) {
                if(this._timeoutId) {
                    //normally the timeout should not cause anything anymore
                    //but just to make sure
                    window.clearTimeout(this._timeoutId);
                    this._timeoutId = null;
                }
                this._onDone(this._xhr, this._context);
                if (this._xhr.status >= this._STATUS_OK_MINOR && this._xhr.status <  this._STATUS_OK_MAJOR) {
                    this._onSuccess(this._xhr, this._context);
                } else {
                    this._onError(this._xhr, this._context);
                }
            }
        } catch (e) {
            this._onException(this._xhr, this._context, "myfaces._impl.xhrCore._AjaxRequest", "callback", e);
        } finally {
            //final cleanup to terminate everything
        }
    }
});

