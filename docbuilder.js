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
 * @throws Error on fail
 */
const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(
            `${process.cwd()}/${constants.SETTINGS_FILE}`))
    } catch (err) {
        scriptError(`Can't find a local '${constants.SETTINGS_FILE}' configuration file.`)
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

process.stdout.write(`${colors.DIM}${colors.YELLOW}Logging output to '${constants.LOG_FILE}'...${colors.CLEAR}\n\n`)

//  Run each job
settings['jobs'].forEach(job => {
    //  Verify object format
    if(job['job'] === undefined || job['generator'] === undefined || job['path'] === undefined)
        scriptError(`Invalid settings format.`)

    process.stdout.write(`Running job ${job['job']}...\n`)

    var execCommand = settings['generators'][job['generator']]
    execCommand = execCommand.replace('$PROJECT_LOCATION', job['path'])
    execCommand = execCommand.replace('$PROJECT', job['job'])
    const res = shell.exec(execCommand, { silent: true })

    //res.code
    //res.stdout
    //res.stderr

    if(res.code != 0)
        process.stdout.write(`${colors.RED}WARNING:  Problems running job '${job['job']}' see log for details...${colors.CLEAR}\n`)
})

process.stdout.write(`\n${colors.DIM}${colors.GREEN}Done!${colors.CLEAR}\n`)
