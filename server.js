const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        // 提供 index.html
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        });
    }
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 存储所有连接的客户端
const clients = new Set();

// 获取客户端IP地址
function getClientIp(req) {
    let ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress;
    
    // 如果是 IPv6 格式的 ::ffff:IPv4，只保留 IPv4 部分
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7);
    }
    return ip;
}

// WebSocket 连接处理
wss.on('connection', (ws, req) => {
    // 获取客户端IP
    const clientIp = getClientIp(req);
    
    // 添加新客户端
    clients.add(ws);
    console.log(`新用户连接: ${clientIp}`);

    // 发送IP地址给客户端
    ws.send(JSON.stringify({
        type: 'init',
        ip: clientIp
    }));

    // 处理消息
    ws.on('message', (message) => {
        const messageData = JSON.parse(message);
        // 如果消息中没有用户名，使用IP地址
        if (!messageData.username) {
            messageData.username = clientIp;
        }
        // 广播消息给所有客户端
        const messageStr = JSON.stringify(messageData);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    });

    // 处理连接关闭
    ws.on('close', () => {
        clients.delete(ws);
        console.log(`用户断开连接: ${clientIp}`);
    });
});

// 启动服务器
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 