## Docbuilder

```
{
    "generators": {
        "doxygen": "doxygen \"$(find $PROJECT_LOCATION -maxdepth 1 -type f -name *.doxyfile)\"",
        "jdoc": "npx jsdoc $PROJECT.js"
    },
    "jobs": [
        {
            "job": "wtengine",
            "generator": "doxygen",
            "path": "/"
        },
        {
            "job": "ppms",
            "generator": "doxygen",
            "path": "/"
        },
        {
            "job": "libwtf",
            "generator": "doxygen",
            "path": "/"
        },
        {
            "job": "http_session_auth",
            "generator": "doxygen",
            "path": "/"
        },
        {
            "job": "wtgui",
            "generator": "jdoc",
            "path": "/"
        }
    ]
}
```