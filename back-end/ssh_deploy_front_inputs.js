import { Client } from 'ssh2';
import fs from 'fs';

const conn = new Client();

const config = {
  host: '103.232.121.20',
  port: 22,
  username: 'root',
  password: 'Minhhoang.2004',
  readyTimeout: 120000
};

const localZipPath = 'd:/Project/REACT-WebFashion/front-end/dist.zip';
const remoteZipPath = '/root/WebFashon-ReactJS/front-end/dist.zip';

const localCodePath = 'd:/Project/REACT-WebFashion/front-end/src/pages/admin/BannerManagement.jsx';
const remoteCodePath = '/root/WebFashon-ReactJS/front-end/src/pages/admin/BannerManagement.jsx';

conn.on('ready', () => {
  console.log('SSH connection established for inputs style deployment');
  
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      process.exit(1);
    }
    
    console.log(`Uploading local ${localZipPath} to remote ${remoteZipPath}...`);
    const zipReadStream = fs.createReadStream(localZipPath);
    const zipWriteStream = sftp.createWriteStream(remoteZipPath);
    
    zipWriteStream.on('close', () => {
      console.log('Zip upload complete. Uploading BannerManagement.jsx source file...');
      
      const codeReadStream = fs.createReadStream(localCodePath);
      const codeWriteStream = sftp.createWriteStream(remoteCodePath);
      
      codeWriteStream.on('close', () => {
        console.log('Source file upload complete. Setting up files on remote server...');
        
        const setupCommands = [
          'cd ~/WebFashon-ReactJS/front-end',
          'rm -rf build_dist',
          'mkdir -p build_dist',
          'unzip -o dist.zip -d build_dist/ || true',
          'rm -f dist.zip',
          'cd ~/WebFashon-ReactJS',
          'docker compose build front',
          'docker compose up -d front'
        ].join(' && ');
        
        console.log('Executing remote build & restart...');
        conn.exec(setupCommands, (execErr, stream) => {
          if (execErr) {
            console.error('Exec error:', execErr);
            conn.end();
            process.exit(1);
          }
          
          stream.on('close', (code) => {
            console.log(`Remote execution completed with code ${code}`);
            conn.end();
            process.exit(code);
          }).on('data', (data) => {
            process.stdout.write(data.toString());
          }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
          });
        });
      });
      
      codeReadStream.pipe(codeWriteStream);
    });
    
    zipReadStream.pipe(zipWriteStream);
  });
}).on('error', (err) => {
  console.error('SSH connection failed:', err);
}).connect(config);
