// const http = require('http');
// const url = require('url');
// const fs = require('fs');
// const path = require('path');

// function createLocalFileServer(folder, port = 9999) {
//     const server = http
//         .createServer(function (req, res) {
//             console.log(`${req.method} ${req.url}`);

//             const parsedUrl = url.parse(req.url);

//             const sanitizePath = path
//                 .normalize(parsedUrl.pathname)
//                 .replace(/^(\.\.[\/\\])+/, '');
//             let pathName = path.join(__dirname, folder, sanitizePath);

//             if (!fs.existsSync(pathName)) {
//                 res.statusCode = 404;
//                 res.end(`File ${pathName} not found!`);
//                 return;
//             }

//             // if (fs.statSync(pathName).isDirectory()) {
//             //     res.statusCode = 401;
//             //     res.end(`${pathName} is a folder!`);
//             //     return;
//             // }

//             try {
//                 fs.readFileSync(pathName);
//                 res.setHeader(
//                     'Content-type',
//                     'application/json' || 'text/plain'
//                 );
//                 res.end(data);
//             } catch (e) {
//                 res.statusCode = 500;
//                 res.end(`Error getting the file: ${err}.`);
//             }
//         })
//         .listen(parseInt(port));

//     console.log(`Server listening on port ${port}`);
// }

// module.exports = {
//     createLocalFileServer,
// };


// var basePath = __dirname;
import http from 'http';
import {createReadStream} from 'fs';
import path from 'path';

export function createLocalFileServer(folderPath = './') {
    http.createServer(function(req, res) {
        console.log('req');
        var stream = createReadStream(path.join(folderPath, req.url));
        stream.on('error', function() {
            res.writeHead(404);
            res.end();
        });
        stream.pipe(res);
    }).listen(9999);
}

