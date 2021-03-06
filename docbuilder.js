#!/usr/bin/env node
/**
 * @author Matthew Evans
 * @module spongex/docbuilder
 * @see README.md
 * @copyright MIT see LICENSE.md
 */

const fs = require('fs')
const { exec } = require('child_process')

/**
 * Font colors
 */
const colors = {
    RED:    `\x1b[31m`,
    GREEN:  `\x1b[32m`,
    YELLOW: `\x1b[33m`,
    CYAN:   `\x1b[36m`,
    DIM:    `\x1b[2m`,
    CLEAR:  `\x1b[0m`
}

/**
 * Constants
 */
const constants = {
    SETTINGS_FILE: `.docbuilder_config.json`,
    LOG_FILE: `.docbuilder.log`,
    OUTPUT_FOLDER: 'docs'
}

/**
 * Display an error message and exit script.
 * @param {String} message Message to display.
 */
const scriptError = (message) => {
    process.stdout.write(`${colors.RED}Error:  ${message}  Exiting...${colors.CLEAR}\n`)
    process.exit(1)
}

/**
 * Load local settings file
 * @returns Settings JSON object
 * @throws Error on fail then exits script
 */
const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(
            `${process.cwd()}/${constants.SETTINGS_FILE}`))
    } catch (err) {
        scriptError(`Can't find a local '${constants.SETTINGS_FILE}' configuration file.`)
    }
}

/**
 * Write a message to the log file
 * @param {String} message String to write
 * @throws Error on fail then exits script
 */
const writeLog = (message) => {
    try {
        fs.appendFileSync(`${process.cwd()}/${constants.LOG_FILE}`, message)
    } catch (err) { scriptError(err) }
}

/**
 * Check if a folder exists, then create it if one does not
 * @param {String} folder 
 * @throws Error on fail then exits script
 */
const verifyFolder = (folder) => {
    try {
        fs.accessSync(folder)
    } catch (err) {
        try {
            fs.mkdirSync(folder)
        } catch (err) { scriptError(err) }
    }
}

/**
 * Job runner - wraps exec in a promise array and runs all jobs
 * @param {Array} jobs An array of jobs to run
 * @param {String} command The system command to run
 * @param {Function} splicer The splicer function to edit the command
 * @param {Function} callback Command callback
 * @return {Promise} Result of all jobs
 */
 const jobRunner = async (jobs, command, splicer, callback) => {
    splicer = splicer || (() => { return command })
    callback = callback || (() => {})
    //  Wrapper class for promises
    class Resolver {
        constructor() {
            this.promise = new Promise((resolve, reject) => {
                this.reject = reject
                this.resolve = resolve
            })
        }
    }
    //  Run all the jobs, resolve/reject promise once done
    var runningJobs = []
    jobs.forEach(job => {
        runningJobs.push(new Resolver())
        const jobIDX = runningJobs.length - 1
        const run_command = splicer(job, command)
        exec(run_command, (error, stdout, stderr) => {
            var cmdRes = null
            if(error) {
                cmdRes = { name: job['name'], command: run_command,
                           code: error.code, stdout: stdout, stderr: stderr }
                runningJobs[jobIDX].reject(cmdRes)
            } else {
                cmdRes = { name: job['name'], command: run_command,
                           code: 0, stdout: stdout, stderr: stderr }
                runningJobs[jobIDX].resolve(cmdRes)
            }
            callback(error, cmdRes)
        })
    })
    //  Collect the promises and return once all complete
    var jobPromises = []
    runningJobs.forEach(job => { jobPromises.push(job.promise) })
    return await Promise.allSettled(jobPromises)
}

/*
 * Main script
 */
process.stdout.write(`${colors.CYAN}Documentation Generation Script${colors.CLEAR}\n\n`)

const settings = loadSettings()

//  Verify settings format
if(settings['generators'] === undefined) scriptError('Must define documentation generators to run.')
settings['jobs'].forEach(job => {
    if(job['name'] === undefined || job['generator'] === undefined || job['path'] === undefined)
        scriptError(`Invalid job format.`)
})

//  Override constants if any are defined in settings
if(settings['LOG_FILE'] !== undefined) constants.LOG_FILE = settings['LOG_FILE']
if(settings['OUTPUT_FOLDER'] !== undefined) constants.OUTPUT_FOLDER = settings['OUTPUT_FOLDER']

//  If nologging is defined in settings, skip logging
if(!settings['nologging']) {
    process.stdout.write(
        `${colors.DIM}${colors.YELLOW}Logging output to '${constants.LOG_FILE}'...${colors.CLEAR}\n\n`)

    //  Remove old log file
    try {
        fs.unlinkSync(`${process.cwd()}/${constants.LOG_FILE}`)
    } catch (err) {}
    writeLog(`Documentation Generation Script Log File\n\n`)
}

//  Remove old documentation folder if defined in settings
if(settings['removeold']) {
    try {
        fs.rmSync(`${process.cwd()}/${constants.OUTPUT_FOLDER}`, {recursive: true, force: true})
    } catch (err) {}
}
verifyFolder(`${process.cwd()}/${constants.OUTPUT_FOLDER}`)

var logRes = ""
process.stdout.write(`Running jobs, please wait...\n`)
jobRunner(settings['jobs'], "",
    (job) => {
        if(job['checkfolder']) verifyFolder(`${process.cwd()}/${constants.OUTPUT_FOLDER}/${job['job']}`)
        var runCmd = settings['generators'][job['generator']]
        runCmd = runCmd.replaceAll('$PROJECT_LOCATION', job['path'])
        runCmd = runCmd.replaceAll('$PROJECT', job['name'])
        runCmd = runCmd.replaceAll('$OUTPUT_FOLDER', constants.OUTPUT_FOLDER)
        return runCmd
    },
    (error, cmdRes) => {
        logRes += `--------------------------------------------------\n` +
            `Job: ${cmdRes.name}\n--------------------------------------------------\n` +
            `Command: ${cmdRes.command}\nReturn code: ${cmdRes.code}\n\nOutput:\n${cmdRes.stdout}\nErrors:\n${cmdRes.stderr}\n\n`
        if(error)
            process.stdout.write(`\n${colors.RED}WARNING:  ` +
                `Problems running job '${cmdRes.name}' see log for details...${colors.CLEAR}\n`)
    }
).then(jobResults => {
    var goodRes = jobResults.length
    jobResults.forEach(job => {if(job.status == 'rejected') goodRes-- })
    if(!settings['nologging']) {
        writeLog(logRes + `--------------------------------------------------\n\n`)
        writeLog(`${goodRes} of ${jobResults.length} jobs completed successfully at ${new Date().toString()}`)
    }
    process.stdout.write(`\n${goodRes} of ${jobResults.length} jobs completed successfully at ${new Date().toString()}`)
    process.stdout.write(`\n${colors.GREEN}Done!${colors.CLEAR}\n`)
})