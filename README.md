A way to inspect the entire type hierarchy of an object, including properties inherited (and potentially overridden) from its prototype chain. 

Given any object or primitive, the `describe()` function lists the type of object and its value, if it’s a primitive. Then, for each of the original object’s properties, their types and values recursively. Finally, it moves up the prototype chain to capture all of the objec’s inherited properties as well.

`describe()` returns a nested data structure that represents the details of the type hierarchy. The `render` module provides formatters, for example to render the type hierarchy as HTML.