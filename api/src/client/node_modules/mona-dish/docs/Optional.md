# Optional and why?

Optional is a construct to avoid explicit null/undefined references.
In Typescript this construct is not explicitly needed anymore because
we have optional references within the language. Which in my opinion is the better
construct. However in javascript we don´t.

So what happens here

typescript

* a.b.c if be defaults to null, results in a null pointer error
* a?.b?.c howver returns a null 

The first construct usually if no optional references are given, must be resulved
by a chain of boolean if conditions.

```typescript
if('undefined' != typeof a  && null != a && 'undefined' != typeof a.b && null != typeof a.b) {
    return a.b.c;
} else {
    return null;
}
```

Now you can see, whenever we have such construct and no direct language support
there must be an easier way, and there Optional and Config come into play.

```
if(Optional.fromNullable(myVar).isAbsent()) {
    //do something
}
```

The same goes for exists checks:
```Typescript
let opt = Optional.fromNullable(myVar);
if(Optional.fromNullable(myVar).isPresent()) {
    //do something
    let theValue = opt.value; //lets fetch the value
}
```

Also as convenience you now have an easier way to check for existence in nested structures
```Typescript
        let myStruct = {
            data: {
                value: 1,
                value2: Optional.absent,
                value4: Optional.fromNullable(1)
            },
            data2: [
                {booga: "hello"},
                "hello2"
            ]
        };
        
        let opt = Optional.fromNullable(myStruct);
        opt.getIf("data", "value3").isAbsent(); // returns true
        opt.getIf("data", "value4").value; //returns 1
        opt.getIf("data2[0]", "booga").value; //returns "hello"
        opt.getIf("data2[1]").value; //returns "hello2"
                
```             
  
* or in a typesafe manner: 

```Typescript
    opt.resolve(item => item.data.value3).isAbsent()
    opt.resolve(item => item.data.value4).value


```  
if the data cannot be resolved optional is returnd in a state of absent

  
As you can see, it is very easy to fetch cascaded data. The result of getIf always is another optional.
To access the value of the optional, simply use the .value property.
  
Optional is readonly and sideffect free.