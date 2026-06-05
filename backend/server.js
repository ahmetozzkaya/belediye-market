const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

// io nesnesini route'lara aktar
app.set('io', io);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/reviews', require('./routes/reviews'));

app.get('/api/health', (req, res) => res.json({ status: 'Sunucu çalışıyor' }));

app.use('/api/*', (req, res) => res.status(404).json({ message: 'Endpoint bulunamadı' }));

io.on('connection', (socket) => {
  console.log(`[Socket] Bağlandı: ${socket.id}`);
  socket.on('join', (roomId) => {
    socket.join(roomId);
    console.log(`[Socket] ${socket.id} → ${roomId} odasına katıldı`);
  });
  socket.on('disconnect', () => {
    console.log(`[Socket] Ayrıldı: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor`));
