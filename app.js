const http = require('http')
const url = require('url')
const fs = require('fs')
const mime = require('mime-types')
const HTTPServer = http.createServer()
const child_process = require('child_process')

var config;

// Read configuration file
try {
	config = JSON.parse(fs.readFileSync("config.json").toString())
} catch (e) {
	if(e.code == 'ENOENT'){
		console.error('No config file "config.json"')
	}else{
		console.error(e)
	}
	process.exit(e.errno)
}

// Repo info/refs
function inforefs(req, res, reqUrl) {
    var repoPath = config.root + reqUrl.pathname.replace("info/refs","")
    var service = reqUrl.query.service
    if(service.length){
        res.setHeader("Content-type","application/x-" + service +"-advertisement")
        var proc = child_process.spawn('git', [service.substr(4), '--stateless-rpc', '--advertise-refs', repoPath])
        var data = ""
        proc.stdout.on('data', (chunk) => {
            data = chunk.toString()
        })
        proc.stdout.on('end', () => {
            service = "# service=" + service + '\n'
            var len = (service.length + 4).toString(16)
            while(len.length < 4){
                len = '0' + len
            }
            var msg = len+service+data+'0000'
            res.writeHead(200, "OK")
            res.end(msg)
        })
        proc.stderr.on('data', (chunk) => {
            console.error(chunk.toString())
        })
        proc.on('error', (err) => {
            console.error(err)
            res.writeHead(403)
            res.end('403 Forbidden\n')
        })
    }else{
        res.writeHead(400, {'Content-Type': 'text/plain'})
        res.end('400 Bad Request\n')
    }
}

// Static file
function staticfile(req, res, reqUrl) {
    var filePath = config.root + reqUrl.pathname;
    fs.stat(filePath, (err, stats) => {
        if(err || !stats.isFile()){
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end('404 Not Found\n')
        }else{
            var mimetype = mime.lookup(filePath)
            if(!mimetype){
                mimetype = 'application/octet-stream'
            }
            res.writeHead(200, {'Content-Type': mimetype})
            var stream = fs.createReadStream(filePath)
            stream.pipe(res)
        }
    })
}

// RPC
function rpcreq(req, res, reqUrl){
    var command = (/\/[^\/]*$/).exec(reqUrl.pathname).toString()
	var repo = config.root + reqUrl.pathname.slice(0, reqUrl.pathname.length - command.length)
	if (command.length){
		res.setHeader("Content-type","application/x-" + command.slice(1) +"-advertisement")
		res.writeHead(200)
		var proc = child_process.spawn('git', [command.slice(5), '--stateless-rpc', repo])
		req.on('data', (msg) => {
			proc.stdin.write(msg)
		})
        proc.stdout.on('data', (chunk) => {
            res.write(chunk)
        })
        proc.stdout.on('end', () => {
			if(command.slice(5) == 'receive-pack'){
				child_process.execFile('git', ['--git-dir', repo, 'update-server-info'], (err, outstr, errstr) => {
					if(err){
						console.error(err.toString())
					}
					if(outstr){
						console.log(outstr.toString())
					}
					if(errstr){
						console.error(errstr.toString())
					}
				})
			}
			res.end()
        })
        proc.stderr.on('data', (chunk) => {
            console.error(chunk.toString())
        })
        proc.on('error', (err) => {
            console.error(err.toString())
            res.writeHead(403)
            res.end('403 Forbidden\n')
        })
	}else{
		res.writeHead(400, {'Content-Type': 'text/plain'})
        res.end('400 Bad Request\n')
	}
}

// Get HTTP request
HTTPServer.on('request', (req, res) => {
	var reqUrl = url.parse(req.url, true)
	if((req.method == 'GET')||(req.method == 'HEAD')){
		if(reqUrl.pathname.endsWith('info/refs')){
			inforefs(req, res, reqUrl)
		}else{
			staticfile(req, res, reqUrl)
		}
	}
	else if(req.method == 'POST'){
		rpcreq(req, res, reqUrl)
	}else{
		res.statusCode = 405;
		res.end("Method Not Allowed");
	}
})
// HTTP Listen
HTTPServer.listen(3081, () => {
	console.log("Git HTTP listening on port "+ HTTPServer.address().port)
})
