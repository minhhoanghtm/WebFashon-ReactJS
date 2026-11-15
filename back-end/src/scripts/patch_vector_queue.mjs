import fs from 'fs';

const filePath = 'back-end/src/modules/ai/queues/vectorSync.queue.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `    vectorSyncWorker.on("failed", (job, err) => {
      logger.warn(\`[VectorSync Worker] Job \${job?.id} failed: \${err.message}\`);
    });`;

const newCode = `    vectorSyncWorker.on("failed", (job, err) => {
      logger.warn(\`[VectorSync Worker] Job \${job?.id} failed: \${err.message}\`);
    });

    vectorSyncWorker.on("error", (err) => {
      logger.warn(\`[VectorSync Worker] Worker warning:\`, err.message);
    });`;

content = content.replace(oldCode.replace(/\r\n/g, '\n'), newCode);
content = content.replace(oldCode.replace(/\n/g, '\r\n'), newCode.replace(/\n/g, '\r\n'));

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched vectorSync.queue.js!');
