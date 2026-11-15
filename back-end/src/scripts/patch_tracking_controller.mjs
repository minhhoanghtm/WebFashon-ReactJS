import fs from 'fs';

const filePath = 'back-end/src/modules/tracking/tracking.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldMethod = `  async streamLivePresence(req, res) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    try {
      const initial = await presenceService.getLiveSessions({ limit: 100 });
      res.write(\`data: \${JSON.stringify({ type: "snapshot", data: initial })}\\n\\n\`);
    } catch {
      // ignore
    }

    const interval = setInterval(async () => {
      try {
        const live = await presenceService.getLiveSessions({ limit: 100 });
        res.write(\`data: \${JSON.stringify({ type: "update", data: live })}\\n\\n\`);
      } catch {
        // ignore
      }
    }, 4000);

    req.on("close", () => {
      clearInterval(interval);
      res.end();
    });
  }`;

const newMethod = `  async streamLivePresence(req, res) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    let isClosed = false;

    const cleanup = () => {
      if (isClosed) return;
      isClosed = true;
      clearInterval(interval);
      if (!res.writableEnded) {
        try {
          res.end();
        } catch {}
      }
    };

    req.on("close", cleanup);
    req.on("end", cleanup);
    req.on("error", cleanup);
    res.on("error", cleanup);

    const safeWrite = (data) => {
      if (isClosed || res.writableEnded || res.destroyed) return;
      try {
        res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
      } catch {
        cleanup();
      }
    };

    try {
      const initial = await presenceService.getLiveSessions({ limit: 100 });
      safeWrite({ type: "snapshot", data: initial });
    } catch {
      // ignore
    }

    const interval = setInterval(async () => {
      if (isClosed || res.writableEnded || res.destroyed) {
        clearInterval(interval);
        return;
      }
      try {
        const live = await presenceService.getLiveSessions({ limit: 100 });
        safeWrite({ type: "update", data: live });
      } catch {
        // ignore
      }
    }, 4000);
  }`;

content = content.replace(oldMethod.replace(/\r\n/g, '\n'), newMethod);
content = content.replace(oldMethod.replace(/\n/g, '\r\n'), newMethod.replace(/\n/g, '\r\n'));

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully hardened streamLivePresence in tracking.controller.js!');
