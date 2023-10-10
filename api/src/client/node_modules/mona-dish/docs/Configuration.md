# Configuration  

Configuration basically is a non sideffect free implementation of a nested ValueEmbedder. Aka, you can assign values
to certain points in your data representation and even if the subtree
does not exist it will be created.


Example:

```Typescript
let config = new Config({
                         data: {
                             value: 1,
                             value2: Optional.absent,
                             value3: null
                         },
                         data2: [
                             {booga: "hello"},
                             "hello2"
                         ]
                     });
                     
config.getIf("hello", "world", "from").isAbsent() //returns true                     
config.apply("hello", "world", "from").value = "me" //we now assign a new value under the config tree                    
config.getIf("hello", "world", "from").value // returns  "me"     
config.getIf("hello", "world", "from").isAbsent() //returns now false
              
/*
 the config data now looks like:
 {
  data: {
      value: 1,
      value2: Optional.absent,
      value3: null
  },
  data2: [
      {booga: "hello"},
      "hello2"
  ],
  hello: {
      world: {
          from: "me"
      }
  }
}             

*/              

```


Also the assignment of arrays is possible:

```Typescript
config.apply("hello[5]", "world[3]", "from[5]").value = "me"

/*
 the config data now looks like:
 {
  data: {
      value: 1,
      value2: Optional.absent,
      value3: null
  },
  data2: [
      {booga: "hello"},
      "hello2"
  ],
  hello:[
  null,
  null,
  null,
  null,
  null,
  world: [
        null,
        null,
        null,
        from: [
            null,
            null,
            null,
            null,
            null,
            "me"
        ]
    ]
  ]
  
}             

*/    

```
As you can see if values do not exist placeholders in array assignments are filled in (null values in our case)  
  