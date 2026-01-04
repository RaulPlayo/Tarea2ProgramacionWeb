# 🎮 Tarea 2 de Programación Web – CentroGame (E-commerce con GraphQL)

- Bienvenidos a **CentroGame**, una aplicación web completa de gestión y compra de videojuegos, evolucionada a **tienda online** e integrando **GraphQL**, autenticación segura y gestión de pedidos.

---

# ¡Novedades en CentroGame!

##  Carrito de compra y pedidos (E-commerce)
- Los usuarios pueden **añadir juegos al carrito**
- Visualizar productos, cantidades y **precio total**
- **Finalizar compra**, generando un **pedido persistente en base de datos**
- El carrito se vacía automáticamente tras la compra
- Gestión de estados del pedido (`En curso` / `Completado`)
- ![Pedidos!(Tarea2ProgramacionWeb/CapturasPantalla/pedidos.png)
  
 

---

##  Gestión de pedidos (Administrador)
El administrador puede:
- Ver **todos los pedidos** de la plataforma
- Filtrar pedidos por estado:
  - `En curso` 
  - `Completado` 
- Ver el **detalle de cada pedido** (usuario, productos, cantidades y total)

---

##  Gestión de usuarios (Administrador)
- Listar usuarios registrados
- Eliminar usuarios
- Cambiar roles entre **user ↔ admin**

---

##  Integración con GraphQL
El proyecto ha sido actualizado para integrar **GraphQL** junto al API REST existente:

- **GraphQL** se utiliza para:
  - Lectura de productos (**Queries**)
  - Gestión completa de pedidos (**Queries y Mutations**)
- **REST** se mantiene para autenticación (login / registro con JWT)
- Servidor GraphQL integrado con **Express**
  
---

##  ¿Cómo he creado el proyecto?

- Replicando la estructura base indicada en la práctica inicial.
- Configurando **Express** y **MongoDB (Mongoose)**.
- Implementando autenticación JWT con roles y un **administrador por defecto**.
- Desarrollo de:
  - CRUD de videojuegos
- Evolución a **E-commerce**:
  - Carrito de compra
  - Modelo `Order`
  - Flujo completo de compra
- Integración de **GraphQL** mediante schemas y resolvers.
- Frontend consumiendo REST y GraphQL mediante `fetch`.

---

##  Tecnologías utilizadas

| Tipo | Tecnología |
|-----|------------|
| Backend | Node.js, Express |
| API | REST + GraphQL |
| Base de datos | MongoDB + Mongoose |
| Autenticación | JWT |
| Tiempo real | Socket.IO |
| Frontend | HTML, CSS, JavaScript |

---

##  Instalación y uso

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/RaulPlayo/Tarea2ProgramacionWeb

