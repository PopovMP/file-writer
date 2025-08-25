import { join, dirname } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { EOL } from "node:os";
import { setTimeout } from "node:timers";
import { existsSync, readFileSync, unlinkSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import { appendAndForget, writeAndForget, setErrorHandler } from "../index.mjs";


const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

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

    describe("Mixed multiple writes and  appends", () => {
        it("should execute multiple write and append operations", (_t, done) => {
            writeAndForget (filePath, "Line 1" + EOL);
            writeAndForget (filePath, "Line 2" + EOL);
            writeAndForget (filePath, "Line 3" + EOL);
            appendAndForget(filePath, "Line 4" + EOL);
            appendAndForget(filePath, "Line 5" + EOL);
            writeAndForget (filePath, "Line 6" + EOL); // This write overwrites the previous lines
            appendAndForget(filePath, "Line 7" + EOL);
            appendAndForget(filePath, "Line 8" + EOL);
            appendAndForget(filePath, "Line 9" + EOL);

            setTimeout(() => {
                const fileContent = readFileSync(filePath, { encoding: "utf8" });
                const expected = "Line 6" + EOL +
                                 "Line 7" + EOL +
                                 "Line 8" + EOL +
                                 "Line 9" + EOL;
                if (fileContent === expected) {
                    done();
                } else {
                    done(new Error(`Expected ${expected}, got ${fileContent}`));
                }
            }, 1000);
        });
    });
});

describe("errors and concurrency", () => {
    it("reports write errors (ENOENT) via onError", (_t, done) => {
        const missingDirPath = join(__dirname, "no-such-dir", "x.txt");
        /** @type {{stage:string, filepath:string, err:Error}[]} */
        const errors = [];
        setErrorHandler((err, fp, stage) => errors.push({ stage, filepath: fp, err }));

        writeAndForget(missingDirPath, "data");
        setTimeout(() => {
            if (errors.length !== 1) return done(new Error(`Expected 1 error, got ${errors.length}`));
            if (errors[0].stage !== "write") return done(new Error(`Expected stage "write", got "${errors[0].stage}"`));
            done();
        }, 300);
    });

    it("reports rename errors and cleans temp files", (_t, done) => {
        const parentDir = join(__dirname, "files");
        const victim    = join(parentDir, "victim"); // A directory to force EISDIR on rename

        // Ensure clean slate
        if (existsSync(victim)) rmSync(victim, { recursive: true, force: true });
        mkdirSync(victim, { recursive: true });

        /** @type {{stage:string, filepath:string, err:Error}[]} */
        const errors = [];
        setErrorHandler((err, fp, stage) => errors.push({ stage, filepath: fp, err }));

        writeAndForget(victim, "will fail on rename");
        setTimeout(() => {
            // Directory should still exist
            if (!existsSync(victim)) return done(new Error("Expected victim directory to still exist"));

            // No temp files like "victim.tmp-*" should remain in parentDir
            const leftovers = readdirSync(parentDir).filter(name => name.startsWith("victim.tmp-"));
            if (leftovers.length !== 0) return done(new Error(`Temp files not cleaned: ${leftovers.join(", ")}`));

            if (errors.length !== 1) return done(new Error(`Expected 1 error, got ${errors.length}`));
            if (errors[0].stage !== "rename") return done(new Error(`Expected stage "rename", got "${errors[0].stage}"`));

            // Cleanup
            rmSync(victim, { recursive: true, force: true });
            done();
        }, 500);
    });

    it("handles two files independently", (_t, done) => {
        const fileA = join(__dirname, "files", "a.txt");
        const fileB = join(__dirname, "files", "b.txt");
        if (existsSync(fileA)) unlinkSync(fileA);
        if (existsSync(fileB)) unlinkSync(fileB);

        writeAndForget (fileA, "A1\n");
        appendAndForget(fileB, "B1\n");
        appendAndForget(fileB, "B2\n");
        writeAndForget (fileA, "A2\n");
        appendAndForget(fileA, "A3\n");
        writeAndForget (fileB, "B3\n");

        setTimeout(() => {
            const a = readFileSync(fileA, { encoding: "utf8" });
            const b = readFileSync(fileB, { encoding: "utf8" });
            const expA = "A2\nA3\n";
            const expB = "B3\n";
            if (a !== expA) return done(new Error(`A mismatch. Expected:\n${expA}\nGot:\n${a}`));
            if (b !== expB) return done(new Error(`B mismatch. Expected:\n${expB}\nGot:\n${b}`));
            done();
        }, 800);
    });
});