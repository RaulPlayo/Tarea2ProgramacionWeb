const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portal_videojuegos';

console.log('🚀 Iniciando servidor...');
console.log('📁 Directorio actual:', __dirname);

app.use(cors());
app.use(express.json());

const publicPath = path.join(process.cwd(), 'public');
console.log('📂 Ruta pública:', publicPath);
app.use(express.static(publicPath));

const User = require('./models/User');
const Product = require('./models/Product');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Conectado a MongoDB');
  const db = mongoose.connection;
  console.log(`📊 Base de datos: ${db.name}`);

  await User.createDefaultAdmin();

  const productCount = await Product.countDocuments();
  console.log(`🎮 Número de productos en BD: ${productCount}`);

  if (productCount === 0) {
    console.log('🔄 Creando productos de ejemplo...');
    try {
      await Product.create([
        {
          name: "The Legend of Zelda: Breath of the Wild",
          description: "Una aventura épica en el reino de Hyrule",
          price: 59.99,
          imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co49w5.jpg",
          category: "aventura",
          platform: "Nintendo Switch",
          rating: 4.9,
          featured: true
        },
        {
          name: "Cyberpunk 2077",
          description: "RPG de mundo abierto en Night City",
          price: 49.99,
          imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5d8z.jpg",
          category: "rol",
          platform: "PC",
          rating: 4.2,
          featured: false
        },
        {
          name: "God of War Ragnarok",
          description: "Continúa la épica saga nórdica de Kratos y Atreus",
          price: 69.99,
          imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4x7v.jpg",
          category: "acción",
          platform: "PlayStation 5",
          rating: 4.8,
          featured: true
        },
        {
          name: "Halo Infinite",
          description: "El regreso del Jefe Maestro",
          price: 59.99,
          imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co3h7a.jpg",
          category: "shooter",
          platform: "Xbox Series X",
          rating: 4.3,
          featured: false
        }
      ]);
      console.log('✅ 4 productos de ejemplo creados');
    } catch (error) {
      console.error('❌ Error creando productos:', error);
    }
  }
})
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  console.log('🔌 Asegúrate de que MongoDB esté corriendo:');
  console.log('   Windows: net start MongoDB');
  console.log('   Mac: brew services start mongodb-community');
  console.log('   Linux: sudo systemctl start mongod');
  process.exit(1);
});

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

const connectedUsers = new Map();
const typingUsers = new Set();

io.on('connection', (socket) => {
  console.log('💬 Usuario conectado al chat:', socket.id);

  socket.on('user_joined', (userData) => {
    connectedUsers.set(socket.id, userData);
    console.log(`💬 ${userData.username} se unió al chat`);
    
    socket.broadcast.emit('user_joined', {
      username: userData.username,
      message: `${userData.username} se ha unido al chat`,
      timestamp: new Date().toLocaleTimeString()
    });
    
    socket.emit('system_message', {
      message: `Bienvenido al chat, ${userData.username}!`,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on('chat_message', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      const messageData = {
        username: user.username,
        message: data.message,
        timestamp: new Date().toLocaleTimeString()
      };
      
      io.emit('chat_message', messageData);
    }
  });

  socket.on('typing_start', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      typingUsers.add(user.username);
      socket.broadcast.emit('user_typing', Array.from(typingUsers));
    }
  });

  socket.on('typing_stop', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      typingUsers.delete(user.username);
      socket.broadcast.emit('user_typing', Array.from(typingUsers));
    }
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`💬 ${user.username} abandonó el chat`);
      socket.broadcast.emit('user_left', {
        username: user.username,
        message: `${user.username} ha abandonado el chat`,
        timestamp: new Date().toLocaleTimeString()
      });
      connectedUsers.delete(socket.id);
      typingUsers.delete(user.username);
    }
  });
});

app.get('/', (req, res) => {
  const indexPath = path.join(process.cwd(), 'public', 'index.html');
  console.log('📄 Sirviendo index.html desde:', indexPath);
  res.sendFile(indexPath);
});

app.get('/chat', (req, res) => {
  const chatPath = path.join(process.cwd(), 'public', 'chat.html');
  res.sendFile(chatPath);
});

app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    currentDirectory: process.cwd(),
    publicPath: path.join(process.cwd(), 'public'),
    routes: ['/api/auth', '/api/products', '/api/chat', '/api/users']
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Ruta API no encontrada',
    path: req.originalUrl,
    availableRoutes: ['/api/auth/*', '/api/products/*', '/api/chat/*', '/api/users/*']
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🎉 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📂 Directorio de trabajo: ${process.cwd()}`);
  console.log(`🔗 Rutas disponibles:`);
  console.log(`   - http://localhost:${PORT}/ (SPA principal)`);
  console.log(`   - http://localhost:${PORT}/chat (Chat)`);
  console.log(`   - http://localhost:${PORT}/api/debug (Debug)`);
});