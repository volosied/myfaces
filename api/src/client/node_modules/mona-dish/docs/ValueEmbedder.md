# ValueEmbedder

Optional is a purely reasonly construct, now for sideffects
freenes having only readonly operations is fine.
However in iterative systems we often deal with states.
To get the conciciveness of Optional also for
writeable states there is a class available which is inherited
from optional and hence shares the same functionality.

* ValueEmedder


*ValueEmbeder* is basically an optional where you can write the value.
Hence whenever something Optional is given back you will get
a readonly value

With Valueembedder, you can write something to the value

* example:

```Typescript
blarg.value /*of type ValueEmbedder*/ = 'new blarg value'
```
  
Trying that with optional would result in a runtime or compile
error because optional does not expose a setter on value
wheres on ValueEmbedder, whatever is embedded will receive 
the new value.

The embedded object must only follow the object->key notation
aka the value must be an exposed writabble property.

For special cases where you need a special implementation
you can use the *IValueHolder* interface.  
  
Note unlike Optional a value embedder is only single level in its chain resolution
for a deeper nesting of writable optional levels, use Configuration!

