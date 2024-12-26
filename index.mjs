import {appendFile, writeFile}    from "node:fs";
import {clearTimeout, setTimeout} from "node:timers";

/**
 * @typedef {Object} QueueJob
 *
 * @property {number}  timeoutId
 * @property {string}  filepath
 * @property {string}  content
 * @property {boolean} isAppend
 */

/**
 * @typedef {function} Action
 *
 * @param {PathOrFileDescriptor}      filepath
 * @param {(string|Uint8Array)}       data
 * @param {WriteFileOptions}          options
 * @param {(err: Error|null) => void} callback
 * @returns {void}
 */

const TIMEOUT_INTERVAL = 100;

/** @type {Record<string, QueueJob>} */
const queue = {};

/** @type {Record<string, boolean>} */
const busy = {};

/**
 * Append a text content to a file.
 *
 * @param {PathOrFileDescriptor} filepath
 * @param {string}               content
 * @throws {NodeJS.ErrnoException}
 * @returns {void}
 */
export function appendAndForget(filepath, content) {
    doAction(appendFile, filepath, content, true);
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
    doAction(writeFile, filepath, content, false);
}

/**
 * It prevents race conditions on multiple write operations for the same filename.
 * It schedules a write operation, if it is requested before the previous one has finished.
 *
 * @param {Action}  action
 * @param {string}  filepath
 * @param {string}  content
 * @param {boolean} isAppend
 * @throws {NodeJS.ErrnoException}
 * @returns {void}
 */
function doAction(action, filepath, content, isAppend) {
    // Check is there an ongoing write operation
    if (busy[filepath]) {
        /** @type {QueueJob|undefined} */
        const prevQueueJob = queue[filepath];

        // Clear previously scheduled timeout job
        if (prevQueueJob && prevQueueJob.timeoutId) {
            clearTimeout(prevQueueJob.timeoutId);
        }

        // Schedule a new write operation
        const timeoutId = setTimeout(repeatWriteFile, TIMEOUT_INTERVAL, filepath);

        if (prevQueueJob) {
            prevQueueJob.timeoutId = timeoutId;
            if (isAppend) {
                prevQueueJob.content += content;
            } else {
                prevQueueJob.content = content;
            }
        } else {
            queue[filepath] = {
                timeoutId,
                filepath,
                content,
                isAppend,
            };
        }

        return;
    }

    // Mark filePath busy
    busy[filepath] = true;

    // Start write operation
    action(filepath, content, {encoding: "utf8"}, (/** @type {any} */ err) => {
        // Release busy
        delete busy[filepath];

        if (err) {
            throw err;
        }
    });

    /**
     * @param {string} filePath
     * @returns {void}
     */
    function repeatWriteFile(filePath) {
        /** @type {QueueJob} */
        const job = queue[filePath];
        delete queue[filePath];

        doAction(action, job.filepath, job.content, job.isAppend);
    }
}
