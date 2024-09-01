import {join, dirname} from "node:path";
import {describe, it}  from "node:test";
import {fileURLToPath} from "node:url";
import {EOL}           from "node:os";
import {existsSync, readFileSync, unlinkSync} from "node:fs";

import {appendAndForget, writeAndForget} from "../index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, "files", "test.txt");

if (existsSync(filePath)) {
    unlinkSync(filePath);
}

describe("file-writer", () => {
    const textLine = "Hello World!" + EOL;

    describe("writeAndForget", () => {
        it("should write a file", (_t, done) => {
            writeAndForget(filePath, textLine);
            setTimeout(() => {
                const fileContent = readFileSync(filePath, { encoding: "utf8" });
                if (fileContent === textLine) {
                    done();
                } else {
                    done(new Error(`Expected ${textLine}, got ${fileContent}`));
                }
            }, 1000);
        });

        it("should execute multiple write operations", (_t, done) => {
            writeAndForget(filePath, "Farewell and thanks for all the fish!" + EOL);
            writeAndForget(filePath, "Farewell and thanks for all the" + EOL);
            writeAndForget(filePath, "Farewell and thanks for all" + EOL);
            writeAndForget(filePath, "Farewell and thanks" + EOL);
            writeAndForget(filePath, "Farewell and" + EOL);
            writeAndForget(filePath, "Farewell" + EOL);
            writeAndForget(filePath, textLine);

            setTimeout(() => {
                const fileContent = readFileSync(filePath, { encoding: "utf8" });
                if (fileContent === textLine) {
                    done();
                } else {
                    done(new Error(`Expected ${textLine}, got ${fileContent}`));
                }
            }, 1000);
        });
    });

    describe("appendAndForget", () => {
        it("should append a file", (_t, done) => {
            appendAndForget(filePath, textLine);
            appendAndForget(filePath, textLine);
            appendAndForget(filePath, textLine);
            appendAndForget(filePath, textLine);

            setTimeout(() => {
                const fileContent = readFileSync(filePath, { encoding: "utf8" });
                const expected = textLine + textLine + textLine + textLine + textLine;
                if (fileContent === expected) {
                    done();
                } else {
                    done(new Error(`Expected ${expected}, got ${fileContent}`));
                }
            }, 1000);
        });
    });
});
