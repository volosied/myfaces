# RxJS Connectivity
In recent years, rxjs has become a very popular
way of addressing data transformations and event handling
in a reactive way.
It uses the observer pattern.

Theoretically the overlap between rxjs and mona-dish is high
but both have different strengths in other sub-parts.
Where they overlap is mostly in iteration filtering etc...

While RxJS is a reactive api, awaiting a fixed 
processing event handler at the end, mona-dish streams
is a stream api, providing different collectors
and collecting the data in a side effect free way.

At the moment the rxjs bridge is in the works and for the
time being provides only a way from Streams and DomQuery/XMLQuery into rxjs.

The other way the data needs to be collected and mapped into
a stream (I will have a look for a better way in the future)


Example of forwarding data from Stream/Lazystream into RxJS
````typescript
    let probe: Array<number> = [1, 2, 3, 4, 5];
    let probe2: Array<number> = [6, 7, 8, 9, 10];
    
    let stream1 = LazyStream.of<number>(...probe).filter(item => {
        return item != 2;
    });;
    let stream2 = LazyStream.of<number>(...probe2);
    
    let o1 = from(stream1);
    let o2 = from(stream2);
    
    
    let cnt1 = 0;
    let val1  = 0;
    o1.subscribe(value => {
        cnt1++;
        val1 = value;
    })
    
    expect(cnt1 == probe.length - 1).to.be.true;
    expect(val1).to.eq(5);
    
    let cnt2 = 0;
    let val2  = 0;
    o2.subscribe(value => {
        cnt2++;
        val2 = value;
    })
    
    expect(cnt2 == probe.length).to.be.true;
    expect(val2).to.eq(10);
 ````
In this example 2 lazy streams are provided
and then mapped via the from operator straight into rxjs


### DomQuery and XML Query

DomQuery and XMLQuery can be mapped straight into observables using
the *from* function. But you also can use a stream
to achieve it:

example:
```typescript
it('must work with RxJS and DomQuery', function() {
    let probe = DomQuery.querySelectorAll("div");
    let probe2 = DomQuery.querySelectorAll("div");
    let probeCnt = 0;
    let probe2Cnt = 0;
    from(probe).subscribe( el => probeCnt++);
    from(probe2.stream).subscribe( el => probe2Cnt++);
    expect(probeCnt).to.be.above(0);
    expect(probeCnt).to.eq(probe2Cnt);
})
```

## Messages and RxJs connectivity

To enable a forward compatibility between messages and rxjs
the Brokers now have a asSubject(<channel>) Api.
This enables to treat rxjs messages as subjects and works in both directions
aka... 

* a broadcast calls an observer on the subject
* a next call triggers a listener on the broker
* a next call also triggers an observer on the subject


