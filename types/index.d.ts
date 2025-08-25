// types/index.d.ts
// noinspection JSUnusedGlobalSymbols

declare module "@popovmp/file-writer" {

    /**
     * Set the error handler.
     * @param { (err: Error, filepath: string, stage: string) => void } handler The error handler function.
     * @returns { void }
     */
    export function setErrorHandler(handler: (err: Error, filepath: string, stage: string) => void): void;

    /**
     * Check if there are ongoing write operations.
     * @returns {boolean}
     */
    export function isWriterBusy(): boolean;

    /**
     * Append a text content to a file.
     *
     * @param { string} filepath
     * @param { string} content
     * @returns { void }
     */
    export function appendAndForget(filepath: string, content: string): void;

    /**
     * Writes a text content to a file.
     *
     * @param { string } filepath
     * @param { string } content
     * @returns { void }
     */
    export function writeAndForget(filepath: string, content: string): void;
}
