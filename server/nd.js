let http = require('http');
let md = require('./mod'); 
let str = "";

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  for(let i = 0; i < 5; i++)
    if (i == 0)
        str = md.funcy(10) + "\n";
    else
        str += md.funcy(10) + "\n";
  res.end(str);
}).listen(8080);