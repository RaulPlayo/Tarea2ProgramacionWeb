const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Verificar que las variables de entorno se cargan
console.log('🔧 Configurando JWT_SECRET:', process.env.JWT_SECRET ? '✅ Cargado' : '❌ No encontrado');
console.log('🔧 Configurando MONGODB_URI:', process.env.MONGODB_URI ? '✅ Cargado' : '❌ No encontrado');

const config = {
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_para_desarrollo_muy_segura_2024',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/portal_videojuegos'
};

// Si no hay JWT_SECRET, usar uno por defecto
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET no encontrado en .env, usando valor por defecto');
}

module.exports = config;