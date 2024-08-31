import {appendFile, writeFile} from "node:fs";

/**
 * @typedef {Object} QueueJob
 * 
 * @property {NodeJS.Timeout} timeoutID
 * @property {string} filepath
 * @property {string} content
 */

/**
 * @typedef { (filepath: string, content: string, options: any, callback: any) => void } Action
 */

const TIMEOUT_INTERVAL = 100;

/** @type { {[filename: string]: QueueJob} } */
const queue = {};
/** @type { {[filename: string]: boolean} } */
const busy = {};


/**
 * Append a text content to a file.
 * 
 * @param {string} filepath
 * @param {string} content
 * @throws {NodeJS.ErrnoException}
 * @returns {void}
 */
export function appendAndForget(filepath, content) {
    doAction(appendFile, filepath, content);
}

/**
 * Writes a text content to a file.
 * 
 * @param {string} filepath
 * @param {string} content
 * @throws {NodeJS.ErrnoException}
 * @returns {void}
 */
export function writeAndForget(filepath, content) {
    doAction(writeFile, filepath, content);
}

/**
 * It prevents race conditions on multiple write operations for the same filename.
 * It schedules a write operation, if it is requested before the previous one has finished.
 * 
 * @param {Action} action
 * @param {string} filepath
 * @param {string} content
 * @throws {NodeJS.ErrnoException}
 * @returns {void}
 */
function doAction(action, filepath, content) {
    // Check is there an ongoing write operation
    if (busy[filepath]) {
        // Clear previously scheduled timeout job
        if (queue[filepath] && queue[filepath].timeoutID) {
            clearTimeout(queue[filepath].timeoutID);
        }

        // Schedule a new write operation
        const timeoutID = setTimeout(repeatWriteFile, TIMEOUT_INTERVAL, filepath);
        queue[filepath] = {timeoutID, filepath, content};
        return;
    }

    // Mark filePath busy
    busy[filepath] = true;

    // Start write operation
    action(filepath, content, {encoding: "utf8"}, (err) => {
        // Release busy
        delete busy[filepath];

        if (err) {
            throw err;
        }
    });

    /**
     * @param {string} filePath 
     * 
     * @return {void}
     */
    function repeatWriteFile(filePath) {
        /** @type {QueueJob} */
        const job = queue[filePath];
        delete queue[filePath];

        doAction(action, job.filepath, job.content);
    }
}
