const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  imageUrl: {
    type: String,
    required: [true, 'La URL de la imagen es requerida'],
    default: 'https://via.placeholder.com/300x200/6c5ce7/ffffff?text=Imagen+No+Disponible'
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: {
      values: ['aventura', 'rol', 'acción', 'shooter', 'estrategia', 'deportes', 'simulación'],
      message: 'Categoría no válida. Opciones: aventura, rol, acción, shooter, estrategia, deportes, simulación'
    }
  },
  platform: {
    type: String,
    required: [true, 'La plataforma es requerida'],
    enum: {
      values: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'],
      message: 'Plataforma no válida. Opciones: PC, PlayStation, Xbox, Nintendo Switch, Mobile'
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'La calificación no puede ser menor que 0'],
    max: [5, 'La calificación no puede ser mayor que 5']
  },
  featured: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    default: 10,
    min: [0, 'El stock no puede ser negativo']
  }
}, {
  timestamps: true
});

// Índices para búsquedas más rápidas
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ platform: 1 });
productSchema.index({ featured: 1 });

module.exports = mongoose.model('Product', productSchema);