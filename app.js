const cgi = require('cgi')
const fs = require('fs');
const http = require('http');
const server = http.createServer();

// Read configuration file
var config;
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

server.on('request', (req, res) => {
    var cgiFunc = cgi('git',{
        args: ['http-backend'],
        env: {
            'GIT_PROJECT_ROOT': config.GitRoot,
            'GIT_HTTP_EXPORT_ALL': '1'
        }
    })
    cgiFunc(req, res);
})

server.listen(3081)
