const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticateJWT, requireAdmin } = require('../middleware/authenticateJWT');

// Obtener todos los productos (público)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, platform, search } = req.query;
    
    // Construir filtro
    const filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (platform && platform !== 'all') {
      filter.platform = platform;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      success: true,
      products,
      currentPage: parseInt(page),
      totalPages,
      total,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor al obtener productos' 
    });
  }
});

// Obtener producto por ID (público)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }
    
    res.json({
      success: true,
      product
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo producto:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de producto inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// Crear producto (solo admin)
router.post('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    console.log('📥 Recibiendo solicitud para crear producto:', req.body);
    
    const productData = req.body;
    
    // Validaciones adicionales
    if (!productData.name || !productData.description || !productData.price || 
        !productData.category || !productData.platform || !productData.imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos requeridos deben estar completos: nombre, descripción, precio, categoría, plataforma, imagen' 
      });
    }
    
    // Validar que la categoría sea válida
    const validCategories = ['aventura', 'rol', 'acción', 'shooter', 'estrategia', 'deportes', 'simulación'];
    if (!validCategories.includes(productData.category)) {
      return res.status(400).json({ 
        success: false, 
        message: `Categoría inválida. Debe ser una de: ${validCategories.join(', ')}` 
      });
    }
    
    // Validar que la plataforma sea válida
    const validPlatforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'];
    if (!validPlatforms.includes(productData.platform)) {
      return res.status(400).json({ 
        success: false, 
        message: `Plataforma inválida. Debe ser una de: ${validPlatforms.join(', ')}` 
      });
    }
    
    // Crear el producto
    const product = await Product.create(productData);
    
    console.log('✅ Producto creado exitosamente:', product._id);
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      product
    });
    
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Error de validación',
        errors: errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor al crear producto',
      error: error.message 
    });
  }
});

// Actualizar producto (solo admin)
router.put('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    console.log('📥 Recibiendo solicitud para actualizar producto:', req.params.id, req.body);
    
    // Validar que la plataforma sea válida si se envía
    if (req.body.platform) {
      const validPlatforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'];
      if (!validPlatforms.includes(req.body.platform)) {
        return res.status(400).json({ 
          success: false, 
          message: `Plataforma inválida. Debe ser una de: ${validPlatforms.join(', ')}` 
        });
      }
    }
    
    // Validar que la categoría sea válida si se envía
    if (req.body.category) {
      const validCategories = ['aventura', 'rol', 'acción', 'shooter', 'estrategia', 'deportes', 'simulación'];
      if (!validCategories.includes(req.body.category)) {
        return res.status(400).json({ 
          success: false, 
          message: `Categoría inválida. Debe ser una de: ${validCategories.join(', ')}` 
        });
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }
    
    console.log('✅ Producto actualizado exitosamente:', product._id);
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product
    });
    
  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Error de validación',
        errors: errors 
      });
    }
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de producto inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor al actualizar producto',
      error: error.message 
    });
  }
});

// Eliminar producto (solo admin)
router.delete('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de producto inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor al eliminar producto' 
    });
  }
});

module.exports = router;