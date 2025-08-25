import { appendFile, writeFile, rename, unlink } from "node:fs";
import { clearTimeout, setTimeout } from "node:timers";
import process from "node:process";
import console from "node:console";

/**
 * @typedef { Object } QueueJob
 *
 * @property { ReturnType<typeof setTimeout> } timeoutId
 * @property { string }                        filepath
 * @property { string }                        content
 * @property { boolean }                       isAppend
 */

/**
 * @typedef {function} Action
 *
 * @param {string}                    filepath
 * @param {string}                    data
 * @param {{encoding: "utf8"}}        options
 * @param {(err: Error|null) => void} callback
 * @returns {void}
 */

const TIMEOUT_INTERVAL = 100;

/** @type {Record<string, QueueJob>} */
const queue = {};

/** @type {Record<string, boolean>} */
const busy = {};

// Pluggable error reporting
/** @type {(err: Error, filepath: string, stage: "write"|"rename") => void} */
let onError = (err, filepath, stage) => {
    // Default: log to stderr. Consumers can override via setErrorHandler().
    console.error(`[file-writer] ${stage} error for ${filepath}:`, err);
};

/**
 * Override module-level error reporting.
 * @param {(err: Error, filepath: string, stage: "write"|"rename") => void} handler
 */
export function setErrorHandler(handler) {
    onError = handler;
}

/**
 * Check if there are ongoing write operations.
 * @returns {boolean}
 */
export function isWriterBusy() {
    return Object.keys(busy).length > 0;
}

/**
 * Append a text content to a file.
 *
 * @param {string} filepath
 * @param {string} content
 * @throws {NodeJS.ErrnoException}
 * @returns {void}
 */
export function appendAndForget(filepath, content) {
    doAction(/** @type {Action} */ (appendFile), filepath, content, true);
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
    doAction(/** @type {Action} */ (writeFile), filepath, content, false);
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
        const timeoutId = setTimeout(scheduleAction, TIMEOUT_INTERVAL, filepath);

        if (prevQueueJob) {
            prevQueueJob.timeoutId = timeoutId;
            // If a write is queued and an append arrives,
            // the final operation should still be a write (with combined content),
            // not an append to the existing file.
            if (isAppend) {
                // Accumulate appends, but do NOT flip a pending write into append
                prevQueueJob.content += content;
                // keep prevQueueJob.isAppend as-is
            } else {
                // Last write wins: replace content and ensure it's a write
                prevQueueJob.content  = content;
                prevQueueJob.isAppend = false;
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
    const tmpSuffix  = `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const actualPath = isAppend ? filepath : `${filepath}${tmpSuffix}`;

    action(actualPath, content, {encoding: "utf8"}, onActionReady);

    /**
     * @param { Error } errAct
     * @returns { void }
     */
    function onActionReady(errAct) {
        if (errAct) {
            delete busy[filepath];
            onError(/** @type {Error} */(errAct), filepath, "write");
            return;
        }

        if (isAppend) {
            delete busy[filepath];

            scheduleAction(filepath);
        } else {
            rename(actualPath, filepath, (/** @type {any} */ errRen) => {
                delete busy[filepath];
                if (errRen) {
                    unlink(actualPath, () => {});
                    onError(/** @type {Error} */(errRen), filepath, "rename");
                    return;
                }

                scheduleAction(filepath);
            });
        }
    }

    /**
     * @param { string } filePath
     * @returns { void }
     */
    function scheduleAction(filePath) {
        /** @type {QueueJob} */
        const next = queue[filePath];
        if (next) {
            clearTimeout(next.timeoutId);
            delete queue[filePath];
            doAction(next.isAppend ? appendFile : writeFile, next.filepath, next.content, next.isAppend);
        }
    }
}
