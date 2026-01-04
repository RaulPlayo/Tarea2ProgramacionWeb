const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateJWT, requireAdmin } = require('../middleware/authenticateJWT');

router.get('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    console.log('📋 Solicitando lista de usuarios...');
    console.log('👤 Usuario que solicita:', req.user);
    
    const users = await User.find({}, 'username role createdAt updatedAt')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Encontrados ${users.length} usuarios`);
    
    res.json({
      success: true,
      users: users.map(user => ({
        _id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor al obtener usuarios',
      error: error.message 
    });
  }
});

router.put('/:id/role', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    console.log(`🔄 Actualizando rol del usuario ${id} a ${role}`);
    console.log('👤 Usuario que solicita:', req.user);
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rol inválido. Debe ser "user" o "admin"' 
      });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes cambiar tu propio rol' 
      });
    }
    
    const oldRole = user.role;
    user.role = role;
    await user.save();
    
    console.log(`✅ Rol actualizado: ${user.username} (${oldRole} → ${role})`);
    
    res.json({
      success: true,
      message: `Rol de ${user.username} actualizado de ${oldRole} a ${role}`,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('❌ Error actualizando rol:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de usuario inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor al actualizar rol',
      error: error.message 
    });
  }
});

router.delete('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️  Solicitando eliminación del usuario ${id}`);
    console.log('👤 Usuario que solicita:', req.user);
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes eliminarte a ti mismo' 
      });
    }
    
    await User.findByIdAndDelete(id);
    
    console.log(`✅ Usuario eliminado: ${user.username}`);
    
    res.json({
      success: true,
      message: `Usuario ${user.username} eliminado exitosamente`
    });
    
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de usuario inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor al eliminar usuario',
      error: error.message 
    });
  }
});

router.get('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de usuario inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

module.exports = router;