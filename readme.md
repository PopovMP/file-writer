# file-writer

## Description

**file-writer** provides methods for easy fire-and-forget file operations.

It prevents race conditions on multiple write operations for the same filename.
It schedules a write operation, if it is requested before the previous one has finished.

## Installation

```bash
npm install "@popovmp/file-writer"
```

## Usage

```javascript
import {appendAndForget, writeAndForget} from "@popovmp/file-writer";

writeAndForget("example.txt", "Some text\n");
appendAndForget("example.txt", "Another text\n");
```

It safely writes the following content to `example.txt`:

```javascript
import {appendAndForget} from "@popovmp/file-writer";

for (let i = 0; i < 1000; i++) {
    appendAndForget("example.txt", `Line ${i}\n`);
}
```

It throws `NodeJS.ErrnoException`.
