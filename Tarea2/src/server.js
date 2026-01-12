const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

// Apollo Server imports (versión 4.9.0)
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { readFileSync } = require('fs');

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

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'portal-videojuegos-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}));

const publicPath = path.join(process.cwd(), 'public');
console.log('📂 Ruta pública:', publicPath);
app.use(express.static(publicPath));

// Función para cargar el schema GraphQL
function loadGraphQLSchema() {
  try {
    // RUTA CORREGIDA: Ya estás en src/, así que busca en ./graphql/schema.js
    const schemaPath = path.join(__dirname, 'graphql', 'schema.js');
    console.log('📄 Cargando schema desde:', schemaPath);
    
    const schemaContent = readFileSync(schemaPath, 'utf8');
    
    // Extrae el schema GraphQL del archivo
    const schemaMatch = schemaContent.match(/buildSchema\(`([\s\S]*)`\)/);
    if (!schemaMatch) {
      console.error('⚠️  No se encontró buildSchema en el archivo, usando schema directo');
      return schemaContent;
    }
    
    return schemaMatch[1];
  } catch (error) {
    console.error('❌ Error cargando schema GraphQL:', error.message);
    // Schema de respaldo simple
    return `
      type Query {
        hello: String
        products: [Product]
        users: [User]
      }
      
      type Mutation {
        createUser(username: String!, password: String!): User
      }
      
      type User {
        id: ID!
        username: String!
        role: String!
      }
      
      type Product {
        id: ID!
        name: String!
        description: String!
        price: Float!
        imageUrl: String!
      }
    `;
  }
}

// Función para inicializar Apollo Server
async function startApolloServer() {
  try {
    const typeDefs = loadGraphQLSchema();
    
    // Intenta cargar los resolvers
    let resolvers;
    try {
      resolvers = require('./graphql/resolvers');
      console.log('✅ Resolvers cargados correctamente');
    } catch (error) {
      console.error('❌ Error cargando resolvers:', error.message);
      // Resolvers de respaldo
      resolvers = {
        Query: {
          hello: () => '¡Hola desde GraphQL!',
          products: async () => {
            const Product = require('./models/Product');
            return await Product.find();
          },
          users: async () => {
            const User = require('./models/User');
            return await User.find();
          }
        },
        Mutation: {
          createUser: async (_, { username, password }) => {
            const User = require('./models/User');
            const user = new User({ username, password, role: 'user' });
            await user.save();
            return user;
          }
        }
      };
    }
    
    // Crea el servidor Apollo
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true,
    });
    
    // Inicia Apollo Server
    await apolloServer.start();
    
    // Configura el middleware de Apollo en /graphql
    app.use('/graphql', 
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          return { 
            user: req.session?.user || null,
            req: req
          };
        }
      })
    );
    
    console.log('✅ Apollo Server configurado en /graphql');
    
    return apolloServer;
  } catch (error) {
    console.error('❌ Error configurando Apollo Server:', error);
    throw error;
  }
}

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
        }
      ]);
      console.log('✅ 2 productos de ejemplo creados');
    } catch (error) {
      console.error('❌ Error creando productos:', error);
    }
  }
  
  // Inicia Apollo Server después de conectar a MongoDB
  await startApolloServer();
})
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  console.log('🔌 Asegúrate de que MongoDB esté corriendo:');
  console.log('   Windows: net start MongoDB');
  console.log('   Mac: brew services start mongodb-community');
  console.log('   Linux: sudo systemctl start mongod');
  process.exit(1);
});

// Importa rutas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// Configuración de Socket.io
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

// Rutas de la aplicación
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
    routes: [
      '/api/auth', 
      '/api/products', 
      '/api/chat', 
      '/api/users',
      '/graphql'
    ]
  });
});

// GraphQL health check
app.get('/graphql-health', (req, res) => {
  res.json({ 
    status: 'healthy',
    endpoint: '/graphql',
    message: 'GraphQL endpoint está disponible'
  });
});

// Ruta específica para el sandbox de GraphQL
app.get('/graphql-sandbox', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>GraphQL Sandbox</title>
        <script src="https://embeddable-sandbox.cdn.apollographql.com/_latest/embeddable-sandbox.umd.production.min.js"></script>
      </head>
      <body>
        <div id="sandbox" style="width: 100vw; height: 100vh;"></div>
        <script>
          new window.EmbeddedSandbox({
            target: "#sandbox",
            initialEndpoint: "http://localhost:${PORT}/graphql",
          });
        </script>
      </body>
    </html>
  `);
});

// Manejador de errores para API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Ruta API no encontrada',
    path: req.originalUrl,
    availableRoutes: [
      '/api/auth/*', 
      '/api/products/*', 
      '/api/chat/*', 
      '/api/users/*',
      '/graphql'
    ]
  });
});

// Manejador SPA (Single Page Application)
app.get('*', (req, res) => {
  const requestedPath = req.path;
  
  // Si la ruta comienza con /graphql pero no es exactamente /graphql
  // (como /graphql#home), redirige a /graphql
  if (requestedPath.startsWith('/graphql') && requestedPath !== '/graphql') {
    return res.redirect('/graphql');
  }
  
  // Para otras rutas, sirve index.html
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🎉 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📂 Directorio de trabajo: ${process.cwd()}`);
  console.log(`🔗 Rutas disponibles:`);
  console.log(`   - http://localhost:${PORT}/ (SPA principal)`);
  console.log(`   - http://localhost:${PORT}/chat (Chat)`);
  console.log(`   - http://localhost:${PORT}/api/debug (Debug)`);
  console.log(`   - http://localhost:${PORT}/graphql (GraphQL Playground)`);
  console.log(`   - http://localhost:${PORT}/graphql-sandbox (GraphQL Sandbox alternativo)`);
  console.log(`   - http://localhost:${PORT}/graphql-health (GraphQL Health Check)`);
});