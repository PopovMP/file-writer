import { join, dirname } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, unlinkSync } from "node:fs";

import { appendAndForget, writeAndForget } from "../index.mts";
import { EOL } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, "files", "test.txt");

if (existsSync(filePath)) {
    unlinkSync(filePath);
}

describe("file-writer", () => {
    const content: string = "Hello World!" + EOL;

    describe("writeAndForget", () => {
        it("should write a file", (_t, done) => {
            writeAndForget(filePath, content);
            setTimeout(() => {
                const fileContent: string = readFileSync(filePath, { encoding: "utf8" });
                if (fileContent === content) {
                    done();
                } else {
                    done(new Error(`Expected ${content}, got ${fileContent}`));
                }
            }, 1000);
        });

        it("should execute multiple write operations", (_t, done) => {
            writeAndForget(filePath, "Farewell and thanks for all the fish!" + EOL);
            writeAndForget(filePath, content);
            setTimeout(() => {
                const fileContent: string = readFileSync(filePath, { encoding: "utf8" });
                if (fileContent === content) {
                    done();
                } else {
                    done(new Error(`Expected ${content}, got ${fileContent}`));
                }
            }, 1000);
        });
    });

    describe("appendAndForget", () => {
        it("should append a file", (_t, done) => {
            appendAndForget(filePath, content);
            setTimeout(done, 1000);
        });
    });
});
