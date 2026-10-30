import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '103.232.121.20',
  port: 22,
  username: 'root',
  password: 'Minhhoang.2004',
  readyTimeout: 120000
};

conn.on('ready', () => {
  console.log('SSH connection established to VPS.');
  
  const setupCommands = [
    // 1. Chạy container node tạm thời để cập nhật file package-lock.json trên VPS
    'docker run --rm -v /root/WebFashon-ReactJS/back-end:/app -w /app node:22-alpine npm install --package-lock-only',
    'echo "Updated package-lock.json via Docker container successfully."',
    
    // 2. Build lại api image mà không sử dụng cache
    'cd ~/WebFashon-ReactJS',
    'docker compose build --no-cache api',
    
    // 3. Khởi động lại container api
    'docker compose up -d api',
    'docker compose ps'
  ].join(' && ');
  
  console.log('Executing remote commands on VPS to fix package-lock.json and rebuild api...');
  
  conn.exec(setupCommands, (err, stream) => {
    if (err) {
      console.error('Remote exec failed:', err);
      conn.end();
      return;
    }
    stream.on('close', (code) => {
      console.log(`\nRemote build finished with exit code ${code}`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('SSH connection failed:', err);
}).connect(config);
