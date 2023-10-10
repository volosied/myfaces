# The mona-dish streaming api

* note this documentation is a work in progress, I will 
add additional information as my time allows. So stay tuned.

The mona-dish streaming api was heavily inspired by
the java streaming api, which allows using finite and infinite collections and perform operations
on the data in a functional manner.
Same as in java the mona-dish api has lazy and early streams.

Both stream types have their upside and downsides.

## General introduction

What are streams.
The idea of streams is heavily influenced by the lisp way of handling collections
lazily. In Lisp, you basically have collections which can be seen
as Stream of data on which operations can be performed. 
The advantage of this method is that practically you do not have to know
upfront how much data you process and the entire data
processing is performed in small chunks of monadish operations.

Other languages have adopted this idea of treating data in a functional
stream, Java for instance with Java 8.

Now why here in mona-dish? Simple, the pattern is exactly what mona-dish
tries to cover. Functional monadish patterns. And frankly spoken
I needed it for the apache myfaces javascript codebase.

So to stay save licence - wise, I implemented streams within the context of this project.

## Early and Lazy streams

What is the difference. In lazy streams each operation is performed at
the latest point possible in time (most of the time during collecting the data but not necessarily so)
in the order the operations were performed.

Early streams perform the operation at the point in time of the stream 
they are defined... 

Both methods have advantages and disadvantages

Early streams, are faster on small known numbers of datasets, however
for deep chains they might become slower again.
Because ever step in the chain is iterated.

Lazy streams are slower for small number of datasets because a lot of backtracking to the
beginning of the chain is performed, but they start
to outperform the early streams beyond a certain number of datasets
and operations nesting threshold, because only one iteration is done!

Also, you don't have to know upfront how much data is served into the stream chain upfront,
and hence they use less ram because the chain is triggered
on a per item case instead of rolling over the entire collection at once.
So theoretically lazy streams can work over an endless set of data.



### Usage

Each stream has three parts...
1. Datasource
2. Processing/Mapping
3. Reduction/Collection

So what does this mean?

#### Datasource 

Is the part which defines the data, usually it is an array or 
associative array, but generally anything producing data can be
a datasource, it only must implement the 

* *IStreamDataSource* interface with its methods 
 
#### Processing/Mapping

Is the processing part, basically a set of functions performed on a stream
which perform some kind of data transformation/filtering/processing

#### Reduction/Collection

On this stage the processed data is collected into the
expected type of representation, or simply a last final "collecting"
operation is performed upon.


### Examples

So lets put all this theory into practice with a handful of examples


#### Simple Filter

```Typescript

let resultArr = LazyStream.of(...[1,2,3])
                          .filter(item => item != 2)
                          .collect(new ArrayCollector())  

```

would result in following result

```Typescript

resultArr == [1, 3]; //would result in true
```

So in our example we have a simple array and remove the number two
and collect the results of this operation in a new Array.

#### iteration over a collection


So following use-case. You need to perform an operation after a chain 
of other things, which do nothing to influence the stream items themselves.

So basically an endpoint which does not expect a result.

Let's take again our former example and alter it slightly
```Typescript

LazyStream.of(...[1,2,3])
          .filter(item => item != 2)
          .each(item => console.log(item, " ")) 

```

this would result in a console output of

```Typescript
1 3
```

So nothing is returned... the items filter the number 2 upfront
and then print out the remaining items.

### Mapping and Flat Maps

So what is this... To sum it quickly up
mapping is the transformation of one element type into another
flatmapping is, that you sometimes return a collection and want
to streamline it into your one dimensional stream.

That's the theory behind it.
Practically if you map one element to another, you use map
to transform elements and then the result of your mapping operation results in another stream,
and you want to map it into a one dimensional stream, use flatmap.

####Example`for map:
```typescript
LazyStream.of(...[[1],[2],[3], [5,6,6]])
          .map(item => {
                item.push(8);
          })
          .collect(new ArrayCollector()) 
```
results in:

```typescript
[[1,8],[2,8],[3,8], [5,6,6,8]]
````

#### Example for flatmap:

```typescript
LazyStream.of(...[[1],[2],[3], [5,6,6]])
          .flatmap(item => {
                Stream.of(...item)
          })
          .colle`ct(new ArrayCollector()) 
````
results in:`
```typescript
[1,2,3,5,6,6]
``
whereas:
```typescript
LazyStream.of(...[[1],[2],[3], [5,[6],6]])
          .flatmap(item => {
                Stream.of(...item)
          })
          .collect(new ArrayCollector()) 
```          
results in:
```typescript
[1,2,3,5,[6],6] 
```          
because only one level is flatmapped!

## Collecting the data:
There is a generic Collectors interface which can be used
to implement data collectors.

```typescript
/**
 * A generic collector
 */
export interface ICollector<T, S> {
    /**
     * this method basically takes a single stream element
     * and does something with it (collecting it one way or the other
     * in most cases)
     *
     * @param element
     */
    collect(element: T);

    /**
     * the final result after all the collecting is done
     */
    finalValue: S;
}
```


For convenience reasons there is a handful of data collectors
implemented which should cover most use-cases:

* ArrayCollector for simple arrays
* AssocArrayCollector collects a [key,value] tuple stream into an associative array
* FormDataCollector collects a [key,value] tuple stream into a FormData object
* Will be probably changed:
    * QueryFormDataCollector FormData collector for DomQuery with encoding for sourced streams (aka DomQuery elements)
    * QueryFormStringCollector FormData collector for with encoding for key value tuples

### Data Sources

For most cases again we have predefined datasource behavior (Arrays etc…)
but if there is a need to define a custom datasource, you have to implement following
interface:

```typescript
/**
 * Every data source wich feeds data into the lazy stream
 * or stream generally must implement this interface
 *
 * It is basically an iteratable to the core
 */
export interface IStreamDataSource<T> {

    /**
     * @returns true if additional data is present
     */
    hasNext(): boolean;

    /**
     * false if not
     */
    next(): T;

    /**
     * resets the position to the beginning
     */
    reset(): void;
}
```


following data sources are present (with some convenience shortcuts
for the most common elements)

* SequenceDataSource for an arbitrary sequence of numbers
* ArrayStreamDataSource a datasource which encapsulates an array of data
* Also, some internal data sources are implemented which should not be used outside (hence not listed here)

## of, ofAssoc

For convenience reasons you don't have to explicitly define a datasource in many cases
static helper methods provide some quick initialisation methods:

```typescript

        let arrayProbe = [1,2,3,4];
        //inttialize a stream on a given arbitrary array
        let stream2 = LazyStream.of<number>(...arrayProbe);
                
        //iterate over an assoc array
        let assocArrayProbe = {
            key1: "val1",
            key2: 2,
            key3: "val3"
        }
        
        Stream.ofAssoc(assocArrayProbe).each(item => {
          //each entry is a two dimensional array with key value entries  
          expect(item.length).to.eq(2);
          arr1.push(item[0]);
          arr2.push(item[1]);
        });

```


## filter
basically just a standard filter within the stream
you pass a function which returns a boolean value
and if true the element passes the filter


### foreach and reduce

This is pretty much the same as in the java streams.
Foreach operates a final iteration on a stream of elements
passing single elements.

reduce, reduces the stream with a reduction operation into a final result





### API

```Typescript
/**
 * Generic interface defining a stream
 */
export interface IStream<T> {
    /**
     * Perform the operation fn on a single element in the stream at a time
     * then pass the stream over for further processing
     * This is basically an intermediate point in the stream
     * with further processing happening later, do not use
     * this method to gather data or iterate over all date for processing
     * (for the second case each has to be used)
     *
     * @param fn the processing function, if it returns false, further processing is stopped
     */
    onElem(fn: IteratableConsumer<T>): IStream<T>;

    /**
     * Iterate over all elements in the stream and do some processing via fn
     *
     * @param fn takes a single element and if it returns false
     * then further processing is stopped
     */
    each(fn: IteratableConsumer<T>): void;

    /**
     * maps a single element into another via fn
     * @param fn function which takes one element in and returns another
     */
    map<R>(fn?: Mappable<T, R>): IStream<R>;

    /**
     * Takes an element in and returns a set of something
     * the set then is flatted into a single stream to be further processed
     *
     * @param fn
     */
    flatMap<R>(fn?: StreamMapper<T>): IStream<R>;

    /**
     * filtering, takes an element in and is processed by fn.
     * If it returns false then further processing on this element is skipped
     * if it returns true it is passed down the chain.
     *
     * @param fn
     */
    filter(fn?: Matchable<T>): IStream<T>;

    /**
     * functional reduce... takes two elements in the stream and reduces to
     * one from left to right
     *
     * @param fn the reduction function for instance (val1,val2) => val1l+val2
     * @param startVal an optional starting value, if provided the the processing starts with this element
     * and further goes down into the stream, if not, then the first two elements are taken as reduction starting point
     */
    reduce(fn: Reducable<T>, startVal: T): Optional<T>;

    /**
     * returns the first element in the stream is given as Optional
     */
    first(): Optional<T>;

    /**
     * Returns the last stream element (note in endless streams without filtering and limiting you will never reach that
     * point hence producing an endless loop)
     */
    last(): Optional<T>;
    
    /**
     * sort on the stream, this is a special case
     * of an endpoint, so your data which is fed in needs
     * to be limited otherwise it will fail
     * it still returns a stream for further processing
     *
     * @param comparator
     */
    sort(comparator: Comparator<T>): IStream<T>;


    /**
     * returns true if there is at least one element where a call fn(element) produces true
     *
     * @param fn
     */
    anyMatch(fn: Matchable<T>): boolean;

    /**
     * returns true if all elmements produce true on a call to fn(element)
     *
     * @param fn
     */
    allMatch(fn: Matchable<T>): boolean;

    /**
     * returns true if no elmements produce true on a call to fn(element)
     *
     * @param fn
     */
    noneMatch(fn: Matchable<T>): boolean;

    /**
     * Collect the elements with a collector given
     * There are a number of collectors provided
     *
     * @param collector
     */
    collect(collector: ICollector<T, any>): any;

    /**
     * Limits the stream to a certain number of elements
     *
     * @param end the limit of the stream
     */
    limits(end: number): IStream<T>;

    /**
     * returns the stream collected into an array (90% use-case abbreviation
     */
    value: Array<T>;
}
```

Objects of type IStream are exposed at various points in the system

DomQuery exposes it via get stream and get lazyStream

LazyStream and Stream  have static of creation methods
to support the stream creation frm various data types
and data sources.
