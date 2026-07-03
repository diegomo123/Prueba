const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function main() {
  const db = await open({
    filename: './data/chat.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        content TEXT
    );
  `);

  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {}
  });

  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

  app.post('/api/alert', async (req, res) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    let result;
    try {
      result = await db.run('INSERT INTO messages (content) VALUES (?)', `[SISTEMA]: ${message}`);
    } catch (e) {
      return res.status(500).json({ error: 'Database error' });
    }

    io.emit('chat message', `[SISTEMA]: ${message}`, result.lastID);
    res.status(200).json({ success: true });
  });

  io.on('connection', async (socket) => {
    socket.on('chat message', async (msg) => {
      let result;
      try {
        result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
      } catch (e) {
        return;
      }
      io.emit('chat message', msg, result.lastID);
    });

    if (!socket.recovered) {
      try {
        await db.each('SELECT id, content FROM messages WHERE id > ?',
          [socket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            socket.emit('chat message', row.content, row.id);
          }
        );
      } catch (e) {
        // Handle error
      }
    }
  });

  // each worker will listen on a distinct port
  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}

main();
