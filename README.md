A way to inspect the entire type hierarchy of an object, including properties inherited (and potentially overridden) from its prototype chain. 

Given any object or primitive, the `describe()` function lists the type of object and its value, if it’s a primitive. Then, for each of the original object’s properties, their types and values recursively. Finally, it moves up the prototype chain to capture all of the objec’s inherited properties as well.

`describe()` returns a nested data structure that represents the details of the type hierarchy. The `render` module provides formatters, for example to render the type hierarchy as HTML.

## Set-up

1. `npm install`
1. Configure and deploy mltap (*This isn’t automated yet*)
1. `npm run test`

## Development Set-up

### VSCode

### Settings
```json
{
  "eslint.enable": true,
  "eslint.options": {
    "configFile": ".eslintrc.js",
    "ext": [
      ".js",
      ".sjs"
    ]
  }
}
```

### Tasks
```json
{
  "version": "0.1.0",
  "command": "npm",
  "isShellCommand": true,
  "showOutput": "silent",
  "suppressTaskName": true,
  "tasks": [
    {
      "taskName": "test",
      "args": [
        "run",
        "test-pretty"
      ],
      "problemMatcher": {
        "owner": "javascript",
        "fileLocation": [
          "relative",
          "${workspaceRoot}"
        ],
        "pattern": {
          "regexp": "^\\s+at: (.+) \\((.+):(\\d+):(\\d+)\\)",
          "file": 2,
          "line": 3,
          "column": 4,
          "message": 1
        }
      }
    }
  ]
}
```