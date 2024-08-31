# file-writer

## Description

**file-writer** proveds methods for easy fire-and-forget file operations.

It prevents race conditions on multiple write operations for the same filename.
It schedules a write operation, if it is requested before the previous one has finished.

## Installation

```bash
npm install "@popovmp/file-writer"
```

## Usage

```javascript
import {appendAndForget, writeAndForget} from "@popovmp/file-writer";

fileWriter.writeAndForget("example.txt", "Some text\r\n");
fileWriter.appendAndForget("example.txt", "Another text\r\n");
```

It throws `NodeJS.ErrnoException`.
