# Mona-dish

A set of functional programming "inspired" helpers


## What is it?

This project is a set of small helpers which utilize mostly monad and monad like patterns 
to cut down on code for essential tasks.

For now, it is only a small set of Helpers consisting of following items:

* Monad     ... an implementation of a Monad
* [Optional](https://github.com/werpu/mona-dish/blob/master/docs/Optional.md)  ... a class which is derived from Javas optional but also encapsulates elvis operator like accessors
                to cut down on code
* [ValueEmbedder](https://github.com/werpu/mona-dish/blob/master/docs/ValueEmbedder.md) ... if you ever need something like optional but want to write the value as well
                    this might be what you are looking for                 
* Promise   ... a promise shim implementation for older browsers (newer ones have Promised baked in), will be deprecated soon, there are better options
* CancellablePromise ... a promise with cancel functionality
* Configuration ... an Optional utilizing wrapper over json configurations which allow both read and write access 
                   and elvis like access to the data stored in the config
* [Streams](https://github.com/werpu/mona-dish/blob/master/docs/Stream.md) ... a typescript based implementation of early and lazily evaluating streams                   
* [DomQuery](https://github.com/werpu/mona-dish/blob/master/docs/DomQuery.md) ... a jquery like functional query and dom manipulation engine based on querySelectorAll, also support streams and shadow dom trees
* XmlQuery ... a jquery like XML document query selection and manipulation engine ... also supports streams
* [Messaging](https://github.com/werpu/mona-dish/blob/master/docs/Messaging.md) ... a messaging bus which can break page isolation levels to allow communication between iframes/popups/shadow dom/dom
* [RxJS](https://github.com/werpu/mona-dish/blob/master/docs/RxJS.md) ... RxJS bindings 


## Implementation languages
              
Everything is implemented in typescript and can be used straight from the source directories "src/main/typescript".

However, also javascript transpilations for various packaging systems and ecmascript levels are in place as well hosted under "dist".

If you want a cleaner cut between your own typescript sources, and the mona-dish sources there is a d.ts file also,
hosted under "dist".


## building

For building the project you need following
* npm
* webpack

once this is done you can build it by calling ./init.sh one time to install all the needed build dependencies,
after that calling /build.sh rebuilds the entire project.

You also can run mocha based unit tests on the project by calling ./test.sh

(note this is for unixoid systems, windows command files will be added soon, in the meanwhile simply check the command 
sequences in the sh files for building and testing)


## Usage

### Optional

The enhanced documentation for optional can be found here:

* [Optional Documentation](https://github.com/werpu/mona-dish/blob/master/docs/Optional.md)


  
For a non sideffect free implementation, you can use:

### ValueEmbedder  
  
Optional is a purely readonly construct, now for sideffect
free-ness, having only readonly operations is fine.
However, in iterative systems we often deal with states.
To get the conciseness of Optional also for
writeable states there is a class available which is inherited
from optional and hence shares the same functionality.

* ValueEmbedder

* [ValueEmbedder Documentation](https://github.com/werpu/mona-dish/blob/master/docs/ValueEmbedder.md)

 
  
### Configuration  

* [Configuration Documentation](https://github.com/werpu/mona-dish/blob/master/docs/Configuration.md)


### Promise and CancellablePromise

Promise is just a lightweight shim of the Promise API including finally.
Cancellable promise adds on top of that by allowing to cancel 
(aka never hit the then/cancel phase)



### Stream

The idea is to have streams like java does for arrays.
(forEach, filter etc...)


#### Details

The streams are heavily influenced by the java streams.
Currently, two type of streams are implemented
* Early streams (Streams)

The default (working already)
a simple implementation of early evaluating streams 
 
* Lazy Streams (LazyStreams)
Lazily evaluating streams, aka elements are processed at the latest possible
stage, this is the default in Java. The advantage of those is
you basically can process endless data without any impact on ram.
Hence there is a set of Data Providers implemented and a general
DataProvider interface available.



#### Usage


```Typescript
beforeEach(function () {
        this.probe = [1, 2, 3, 4, 5];
});

it("must have a correct first last lazy", function () {
    let stream = LazyStream.of<number>(...this.probe);

    let first = LazyStream.of<number>(...this.probe).filter((data) => data != 5).onElem((data) => {
        data;
    }).first().value;
    let last = Stream.of<number>(...this.probe).filter((data) => data != 5).onElem((data) => {
        data;
    }).last().value;
    expect(first).to.eq(1);
    expect(last).to.eq(4);
});
```

Or in conjunction with DomQuery

```Typescript
let searchRoot = DomQuery.querySelectorAll("input[type='hidden']")
let formWindowId: Optional<string> = searchRoot
                    .stream
                    .map<string>(getValue)
                    .reduce(doubleCheck, INIT); 

let otherStream = LazyStream.ofDataSource(searchRoot);
```

See  [StreamTest.spec.ts](https://github.com/werpu/mona-dish/blob/master/src/test/typescript/StreamTest.ts) in the "test sources" directory
 for additional examples
 
### DomQuery

A JQuery like interface for standard dom queries, also supports Streams and 
Shadow doms. 
Further Info can be found here 

[DomQuery](https://github.com/werpu/mona-dish/blob/master/docs/DomQuery.md) ... a jquery like functional query and dom manipulation engine based on querySelectorAll, also support streams and shadow dom trees


### XmlQuery

similar to DomQuery but atm without a full query engine behind it,
the reason for that is, that the browsers do not have a universal query engine, yet.
Also, I tried to avoid third party dependencies.
You, also, will get many other benefits similar to DomQuery by using XmlQuery


### Messaging

A messaging bus ... for documentation [follow this link:](https://github.com/werpu/mona-dish/blob/master/docs/Messaging.md)

## Extended Documentation

I am going to provide extended documentation on the various
aspects of mona-dish in following subpages

* [Streams](https://github.com/werpu/mona-dish/blob/master/docs/Stream.md)
* [RxJS](https://github.com/werpu/mona-dish/blob/master/docs/RxJS.md)


## Examples

Various usage examples can be found in the tests:

* [DomQuery, XmlQuery](https://github.com/werpu/mona-dish/blob/master/src/test/typescript/DomQueryTest.ts)
* [Optional, ValueEmbedder, Config](https://github.com/werpu/mona-dish/blob/master/src/test/typescript/MonadTest.ts)
* [Promise](https://github.com/werpu/mona-dish/blob/master/src/test/typescript/PromiseTest.ts)
* [Stream](https://github.com/werpu/mona-dish/blob/master/src/test/typescript/StreamTest.ts)
                   


# Changelog
(Starting with version 0.18)

...

## Version 0.18
Adding Extended Array, to provide
shim like functionality without shims
(adds several functions to the standard array
older browsers do not support, but does not
hook itself in like a shim)

## Version 0.19
* New messaging submodule
* Improved documentation
* DomQuery: Shadow Dom support 

## Version 0.19.1 - 0.19.22

* ongoing works in the messaging area (not fully finalized)
* minor api change, channel now parameter in broker.broadcast instead
of part of the message.
* setting the code baseline of the compiled code to es5
* Messaging will be finalized in version 0.20.x
* Minor compiler issues fixed in the "typings" area which could
cause typescript warnings 
* Bidirectional messaging which allows answer/response patterns
* Re-enabling IE11 compatibility
* basing the messaging on top of the broadcast channel as universal base, the messaging
is basically a broadcast channel++ with additional functionality
  
## Version 0.20.++ 
* Rxjs connectivity, rxjs is a more popular framework than mona-dish
but both have a heavy functional overlap. It makes sense
  to open mona-dish for rjxs in both directions to be able
  to combine both frameworks easily
* RXJS forward connectivity enabled via iterable implementation!
you can basically now use streams as iterables
  
* 20.3 Adding basic rxjs support for streams
* 20.4-20.5 Adding rxjs connectivity apis for the messages, brokerchannels now can be 
exported as Subjects

* 0.20.7 Adding encryption extension points to the messaging api
* 0.20.8 extension refinements tests for the extensions documentation updates

## Version 0.21.++ 
* 0.21.0 adding a mutation observer
  
## Version 0.22 ++
* Api change, the Promise has been removed from the index.js and resides
in its own PromiseShim.js file. The reason was UMD builds
did not check for an existing Promise before installing it.
It made sense to decouple it anyway, literally all modern browsers
do not need it anymore. CancellablePromise is still enabled.
* Added convenience methods for easier access to value (via val) and innerHTML,
* mutation observer fixes
* improved nonce handling
* improved rxjs connectivity
* documentation updates
* changing default package type from commonjs to umd, to improve ide handling
* adding a sticky eval to DomQuery to keep the evaled elements in the head
* adding a sticky eval handling to run scripts as well

## Version 0.23+
* (minor version change due to an api change which has been reverted)
* fixing the script loading, loading order now in a series of scripts is in sync with mixed src and embedded scripts (no api change)


## Version 0.24 ++
* Optional typed and semi typed configs which allow fixed keys and subtrees of keys which are not predefined





## Version 0.25 ++
* Fixing of bugs in the stream area
* API change for the lookAhead (might break old code using it)
* Added Config Collector similar to Assoc Array Collectors

This is from now on a development branch, to finally split between
unstable and stable 

#### 0.25.20
Breaking change:

To get reduced coupling between modules
(I want to make the usage of Config optional)
DomQuery does not use Config anymore but relies
on standard associative arrays:

* before: encodeFormElement(toMerge: Config): Config;
* new: encodeFormElement(toMerge: {[key: string]: any}): {[key: string]: any};

Config now is not a dependency of DomQuery anymore!

A new module AssocArray provides helper functions to provide
a similar functionality as Config

#### 0.25.26
Another minor breaking change.

0.25.26 reorganizes the internal data structure of config
to allow easier access and a direct mapping of associative arrays and arrays.
(Allows for easier debugging internal data structures and a small speed bump)
due to this change following construct is not possible anymore

let conf = new Config({});
conf.assign("[5]","[6]","key").value = "new value";

This goes hand in hand with the newly introduced low level associative array api
you have to change the code accordingly
let conf = new Config([]);
conf.assign("[5]","[6]","key").value = "new value";

So always when an array is referenced from root, the root element must be an array otherwise
an exception is thrown (the same goes for existing subelemements)

(the same goes implicity for associative arrays in the other direction, 
arrays cannot have key references anymore with assignments)

## Version 0.26 ++
* Fixing of bugs in the stream area
* API change for the lookAhead (might break old code using it)
* Added Config Collector similar to Assoc Array Collectors

This is from now on a stable branch (and all even numbered ones will be,
with every odd branch there will be a higher even numbered one release
to avoid accidental downloads)


## Version 0.28++
### Important API chnage

* Decoupling of Stream and DomQuery

In order to reduce the possible include size, there now is a stronger decoupling between streams
and DomQuery. You now can use DomQuery without linking the Streams.
In order to do so, the API has slightly changed.
DomQuery.streams now is gone
To generate a Stream of a DomQuery object you can use 
Stream.ofDomQuery and LazyStream.ofDomQuery

The reason was that Streams have a significant code overhead and with ES2019 the native
api has somewhat reached the status of good enough with the inclusion of map.
(internally we provide a non, bleeding shim for that functionality)

If you include Streams the backwards compatibility is restored

* Decoupling of DomQuery and Config

Additional api change, in order do decouple DomQuery and Config
encodeSubmittableFields now returns an associative array instead
of a Config. You can convert it back to an associative array simply by using

**new Config(dq.encodeSubmittableFields())**

### Other changes
* Es2019 Array as non-intrusive Es2019 array shim (providing filter and flapMap to
browsers which do not support it)
* New helper module providing functions similar to what config does to plain associative arrays
* Internal Config data structure reorganisation on top of the new AssocArray helper module
it now uses plain associative arrays as internal data structure to make debugging easier

* added nonce getter to DomQuery (element.nonce.value)

                   
