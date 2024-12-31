const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 服务静态文件
app.use(express.static(path.join(__dirname, './')));

// 存储所有连接的客户端
const clients = new Set();

// WebSocket连接处理
wss.on('connection', (ws) => {
    // 添加新客户端
    clients.add(ws);
    
    // 发送欢迎消息
    ws.send(JSON.stringify({
        type: 'system',
        message: '欢迎加入聊天室！',
        time: new Date().toLocaleTimeString()
    }));

    // 处理接收到的消息
    ws.on('message', (message) => {
        // 广播消息给所有客户端
        const messageData = JSON.parse(message);
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'chat',
                    username: messageData.username,
                    message: messageData.message,
                    time: new Date().toLocaleTimeString()
                }));
            }
        });
    });

    // 处理客户端断开连接
    ws.on('close', () => {
        clients.delete(ws);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 