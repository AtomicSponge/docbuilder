## Docbuilder NodeJS Script

Run multiple document generators for multiple projects with one command.

Uses the [ShellJS](https://www.npmjs.com/package/shelljs) package for running commands.

Install globaly:
```
npm i -g @spongex/docbuilder
```

Or per-project as a dev-dependency:
```
npm i @spongex/docbuilder --save-dev
```

## Usage

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

Then just run the script in the output folder:
```
npx docbuilder
```

## Generators
These are bash-style commands used to launch each different document generator.

The following variables can be used:
- __$PROJECT__ - The name of the project.
- __$PROJECT_LOCATION__ - The full path to the project.
- __$OUTPUT_FOLDER__ - The name of the output folder from settings.
No quotation marks around the names!

## Optional Settings:
- __"LOG_FILE": "filename"__ - Change the filename of the log file.
- __"OUTPUT_FOLDER": "foldername"__ - Change the output folder name. (default docs)
- __"nologging": "nologging"__ - Disable logging.