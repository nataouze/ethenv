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

