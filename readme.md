# file-writer

## Description

**file-writer** proveds methods for easy fire-and-forget file operations.

It caches the content and repeats teh operation on multiple write requests.

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
