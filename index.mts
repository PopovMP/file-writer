import {appendFile, writeFile} from "node:fs";

interface QueueJob {
    timeoutID: NodeJS.Timeout;
    filepath : string;
    content  : string;
}

const TIMEOUT_INTERVAL = 100;

const queue: { [filename: string]: QueueJob } = {};
const busy : { [filename: string]: boolean  } = {};

type Action = (filepath: string, content: string, options: any, callback: any) => void;

/**
 * Append a text content to a file.
 * @throws {NodeJS.ErrnoException}
 */
export function appendAndForget(filepath: string, content: string): void {
    doAction(appendFile, filepath, content);
}

/**
 * Writes a text content to a file.
 * @throws {NodeJS.ErrnoException}
 */
export function writeAndForget(filepath: string, content: string): void {
    doAction(writeFile, filepath, content);
}

/**
 * It prevents race conditions on multiple write operations for the same filename.
 * It schedules a write operation, if it is requested before the previous one has finished.
 *
 * @throws {NodeJS.ErrnoException}
 */
function doAction(action: Action, filepath: string, content: string): void {
    // Check is there an ongoing write operation
    if (busy[filepath]) {
        // Clear previously scheduled timeout job
        if (queue[filepath] && queue[filepath].timeoutID) {
            clearTimeout(queue[filepath].timeoutID);
        }

        // Schedule a new write operation
        const timeoutID: NodeJS.Timeout = setTimeout(repeatWriteFile, TIMEOUT_INTERVAL, filepath);
        queue[filepath] = {timeoutID, filepath, content};
        return;
    }

    // Mark filePath busy
    busy[filepath] = true;

    // Start write operation
    action(filepath, content, {encoding: "utf8"}, (err: NodeJS.ErrnoException | null): void => {
        // Release busy
        delete busy[filepath];

        if (err) {
            throw err;
        }
    });

    function repeatWriteFile(filePath: string): void {
        const job: QueueJob = queue[filePath];
        delete queue[filePath];

        doAction(action, job.filepath, job.content);
    }
}
