// src/graphql/schema.js
const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type User {
    _id: ID!
    username: String!
    role: String!
    orders: [Order]
  }
  
  type Product {
    _id: ID!
    name: String!
    description: String!
    price: Float!
    imageUrl: String!
    category: String!
    platform: String!
    rating: Float
    featured: Boolean
  }
  
  type OrderProduct {
    product: Product!
    quantity: Int!
    priceAtPurchase: Float!
  }
  
  type Order {
    _id: ID!
    user: User!
    products: [OrderProduct!]!
    status: String!
    total: Float!
    createdAt: String!
  }
  
  type Query {
    # Product Queries
    products: [Product!]!
    product(id: ID!): Product
    
    # Order Queries
    orders: [Order!]!
    order(id: ID!): Order
    ordersByStatus(status: String!): [Order!]!
    
    # User Queries
    users: [User!]!
    me: User
  }
  
  type Mutation {
    # Cart & Order Mutations
    addToCart(productId: ID!, quantity: Int!): Boolean!
    clearCart: Boolean!
    checkout: Order!
    
    # User Mutations
    createUser(username: String!, password: String!, role: String): User!
    updateUser(id: ID!, username: String, password: String, role: String): User!
    deleteUser(id: ID!): Boolean!
    
    # Order Mutations
    updateOrderStatus(id: ID!, status: String!): Order!
  }
`);

module.exports = schema;