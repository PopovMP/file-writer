// types/index.d.ts
// noinspection JSUnusedGlobalSymbols

declare module "@popovmp/file-writer" {

    /**
     * Append a text content to a file.
     *
     * @param {string} filepath
     * @param {string} content
     * @throws {NodeJS.ErrnoException}
     * @returns {void}
     */
    export function appendAndForget(filepath: string, content: string): void;

    /**
     * Writes a text content to a file.
     *
     * @param {string} filepath
     * @param {string} content
     * @throws {NodeJS.ErrnoException}
     * @returns {void}
     */
    export function writeAndForget(filepath: string, content: string): void;
}
