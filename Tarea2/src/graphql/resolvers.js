// src/graphql/resolvers.js
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const resolvers = {
  Query: {
    products: async () => {
      return await Product.find();
    },
    product: async (_, { id }) => {
      return await Product.findById(id);
    },
    orders: async () => {
      return await Order.find().populate('user').populate('products.product');
    },
    order: async (_, { id }) => {
      return await Order.findById(id).populate('user').populate('products.product');
    },
    ordersByStatus: async (_, { status }) => {
      return await Order.find({ status }).populate('user').populate('products.product');
    },
    users: async () => {
      return await User.find();
    },
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await User.findById(user.id);
    }
  },
  Mutation: {
    addToCart: async (_, { productId, quantity }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Aquí implementarías la lógica para agregar al carrito
      // Puedes usar LocalStorage o guardar en DB
      return true;
    },
    clearCart: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Limpia el carrito
      return true;
    },
    checkout: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Aquí implementarías la lógica para convertir el carrito en pedido
      // Ejemplo simplificado:
      const cartItems = []; // Obtener del carrito
      
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }
      
      // Calcular total
      const total = cartItems.reduce((sum, item) => 
        sum + (item.priceAtPurchase * item.quantity), 0);
      
      // Crear el pedido
      const order = new Order({
        user: user.id,
        products: cartItems,
        total,
        status: 'pending'
      });
      
      await order.save();
      
      // Agregar al historial del usuario
      await User.findByIdAndUpdate(user.id, {
        $push: { orders: order._id }
      });
      
      return order;
    },
    
    createUser: async (_, { username, password, role }, { user, req }) => {
      if (!user || user.role !== 'admin') {
        throw new Error('Not authorized');
      }
      
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new Error('Username already exists');
      }
      
      const newUser = new User({
        username,
        password,
        role: role || 'user'
      });
      
      await newUser.save();
      return newUser;
    },
    updateUser: async (_, { id, username, password, role }, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new Error('Not authorized');
      }
      
      const updates = {};
      if (username) updates.username = username;
      if (password) updates.password = password;
      if (role) updates.role = role;
      
      const updatedUser = await User.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      );
      
      if (!updatedUser) {
        throw new Error('User not found');
      }
      
      return updatedUser;
    },
    deleteUser: async (_, { id }, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new Error('Not authorized');
      }
      
      if (id === user.id) {
        throw new Error('Cannot delete your own account');
      }
      
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        throw new Error('User not found');
      }
      
      return true;
    },
    updateOrderStatus: async (_, { id, status }, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new Error('Not authorized');
      }
      
      const validStatuses = ['pending', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }
      
      const order = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate('user').populate('products.product');
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    }
  }
};

module.exports = resolvers;