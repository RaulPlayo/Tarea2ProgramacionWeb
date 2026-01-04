const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');

router.get('/verify-access', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    message: 'Acceso al chat permitido',
    user: req.user
  });
});

router.get('/messages', authenticateJWT, async (req, res) => {
  try {
    res.json({
      success: true,
      messages: []
    });
  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

module.exports = router;