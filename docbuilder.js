#!/usr/bin/env node
/**
 * @author Matthew Evans
 * @module spongex/docbuilder
 * @see README.md
 * @copyright MIT see LICENSE.md
 */

const fs = require('fs')
const shell = require('shelljs')

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

/*
 * Main script
 */
process.stdout.write(`${colors.CYAN}Documentation Generation Script${colors.CLEAR}\n\n`)

const settings = loadSettings()

if(settings['generators'] === undefined) scriptError('Must define documentation generators to run.')

//  Override constants if any are defined in settings
if(settings['LOG_FILE'] !== undefined) constants.LOG_FILE = settings['LOG_FILE']
if(settings['OUTPUT_FOLDER'] !== undefined) constants.OUTPUT_FOLDER = settings['OUTPUT_FOLDER']

if (!settings['nologging']) {
    process.stdout.write(
        `${colors.DIM}${colors.YELLOW}Logging output to '${constants.LOG_FILE}'...${colors.CLEAR}\n\n`)

    //  Remove old log file
    try {
        fs.unlinkSync(`${process.cwd()}/${constants.LOG_FILE}`)
    } catch (err) {}

    //  Create new log file
    const date = new Date()
    const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()]
    const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()]
    writeLog(`Documentation Generation Script Log File\n`)
    writeLog(`Last ran: ${month}-${day}-${year} ${hour}:${minutes}:${seconds}\n\n`)
}

verifyFolder(`${process.cwd()}/${constants.OUTPUT_FOLDER}`)

//  Run each job
settings['jobs'].forEach(job => {
    //  Verify object format
    if(job['job'] === undefined || job['generator'] === undefined || job['path'] === undefined)
        scriptError(`Invalid job format.`)

    process.stdout.write(`Running job ${job['job']}... `)

    //  If the checkfolder flag is set, check for the folder and create if it doesn't exist
    if(job['checkfolder']) verifyFolder(`${process.cwd()}/${constants.OUTPUT_FOLDER}/${job['job']}`)

    var execCommand = settings['generators'][job['generator']]
    execCommand = execCommand.replaceAll('$PROJECT_LOCATION', job['path'])
    execCommand = execCommand.replaceAll('$PROJECT', job['job'])
    execCommand = execCommand.replaceAll('$OUTPUT_FOLDER', constants.OUTPUT_FOLDER)
    const res = shell.exec(execCommand, { silent: true })

    if (!settings['nologging'])
        //  Log output & status of job
        writeLog(`--------------------------------------------------\n` +
            `Job: ${job['job']}\n--------------------------------------------------\n` +
            `Command: ${execCommand}\nReturn code: ${res.code}\n\nOutput:\n${res.stdout}\nErrors:\n${res.stderr}\n`)

    if(res.code != 0)
        process.stdout.write(`\n${colors.RED}WARNING:  ` +
            `Problems running job '${job['job']}' see log for details...${colors.CLEAR}\n`)
    else
        process.stdout.write(`${colors.GREEN}Complete!${colors.CLEAR}\n`)
})

process.stdout.write(`\n${colors.GREEN}Done!${colors.CLEAR}\n`)
