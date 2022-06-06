## Docbuilder

Run multiple document generators for multiple projects with one command.

Install globaly:
```
```

Or per-project as a dev-dependency:
```
```

Output of each job is logged in __.docbuilder.log__.

Inside the folder you wish to generate the out put in, create a __.docbuilder_config.json__ file with the following format:
```
{
    "generators": {
        "doxygen": "doxygen \"$(find $PROJECT_LOCATION -maxdepth 1 -type f -name *.doxyfile)\"",
        "jdoc": "npx jsdoc -d $OUTPUT_FOLDER/$PROJECT $PROJECT_LOCATION/$PROJECT.js"
    },
    "jobs": [
        {
            "job": "wtengine",
            "generator": "doxygen",
            "path": "/home/matthew/Projects/wtengine",
            "checkfolder": "true"
        },
        {
            "job": "ppms",
            "generator": "doxygen",
            "path": "/home/matthew/Projects/ppms",
            "checkfolder": "true"
        },
        {
            "job": "libwtf",
            "generator": "doxygen",
            "path": "/home/matthew/Projects/libwtf",
            "checkfolder": "true"
        },
        {
            "job": "http_session_auth",
            "generator": "doxygen",
            "path": "/home/matthew/Projects/http_session_auth",
            "checkfolder": "true"
        },
        {
            "job": "wtgui",
            "generator": "jdoc",
            "path": "/home/matthew/Projects/wtgui"
        }
    ]
}
```

Then just run the script in the output folder
```
npx run docbuilder
```

#### Optional settings:
- __"LOG_FILE": "filename"__ - Change the filename of the log file.
- __"OUTPUT_FOLDER": "foldername"__ - Change the output folder name. (default docs)
- __"nologging": "nologging"__ - Disable logging.