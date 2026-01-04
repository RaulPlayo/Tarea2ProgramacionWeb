// Configuración global
const API_BASE = '/api';
const GRAPHQL_URL = '/graphql'; // Asegurarse de que esta URL esté definida
let currentUser = null;
let currentPage = 1;
let totalPages = 1;
let socket = null;
let cart = []; // Carrito de compras
let orders = []; // Array para almacenar pedidos
let orderFilter = 'all'; // Filtro de pedidos: 'all', 'pending', 'completed'

// Elementos DOM
const elements = {
    // Navegación
    navLinks: document.querySelectorAll('.nav-link'),
    authButtons: document.getElementById('authButtons'),
    userMenu: document.getElementById('userMenu'),
    userGreeting: document.getElementById('userGreeting'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    navToggle: document.getElementById('navToggle'),
    
    // Carrito
    cartIcon: document.getElementById('cartIcon'),
    cartCount: document.getElementById('cartCount'),
    cartItems: document.getElementById('cartItems'),
    cartTotal: document.getElementById('cartTotal'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    cartModal: document.getElementById('cartModal'),
    cartItemsModal: document.getElementById('cartItemsModal'),
    cartTotalModal: document.getElementById('cartTotalModal'),
    checkoutBtnModal: document.getElementById('checkoutBtnModal'),
    cartDropdown: document.getElementById('cartDropdown'),
    
    // Secciones
    sections: document.querySelectorAll('.section'),
    
    // Productos
    productsGrid: document.getElementById('productsGrid'),
    categoryFilter: document.getElementById('categoryFilter'),
    platformFilter: document.getElementById('platformFilter'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    addProductBtn: document.getElementById('addProductBtn'),
    pagination: document.getElementById('pagination'),
    
    // Chat
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    typingIndicator: document.getElementById('typingIndicator'),
    
    // Panel de administrador
    adminPanel: document.getElementById('adminPanel'),
    adminUsersBtn: document.getElementById('adminUsersBtn'),
    adminOrdersBtn: document.getElementById('adminOrdersBtn'),
    adminContent: document.getElementById('adminContent'),
    
    // Modales
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    productModal: document.getElementById('productModal'),
    
    // Formularios
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    productForm: document.getElementById('productForm')
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    setupFormHelpers();
    loadProducts();
    loadCart(); // Cargar carrito al iniciar
    loadOrdersFromStorage(); // Cargar pedidos guardados
}

function setupFormHelpers() {
    // Agregar estilos para texto de ayuda
    const style = document.createElement('style');
    style.textContent = `
        .form-help {
            color: #666;
            font-size: 0.8rem;
            margin-top: 0.25rem;
            display: block;
        }
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: slideIn 0.3s ease;
            color: white;
        }
        .notification-success { background: #00b894; }
        .notification-error { background: #e17055; }
        .notification-info { background: #6c5ce7; }
        .notification-warning { background: #fdcb6e; color: #2d3436; }
        .notification button {
            background: none;
            border: none;
            color: inherit;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        /* Estilos para el panel de administrador */
        .admin-panel {
            margin-top: 2rem;
            padding: 1.5rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .admin-tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        .admin-tab {
            padding: 0.5rem 1rem;
            border: none;
            background: #e0e0e0;
            cursor: pointer;
            border-radius: 4px;
            font-weight: 500;
        }
        .admin-tab.active {
            background: #6c5ce7;
            color: white;
        }
        .admin-user {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            border-bottom: 1px solid #eee;
        }
        .admin-order {
            margin-bottom: 1rem;
            padding: 1rem;
            border: 1px solid #eee;
            border-radius: 4px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        .order-status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        .status-pending {
            background: #fdcb6e;
            color: #2d3436;
        }
        .status-completed {
            background: #00b894;
            color: white;
        }
        .order-details {
            margin-top: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 4px;
            display: none;
        }
        .order-details.active {
            display: block;
        }
        .order-products {
            margin-top: 0.5rem;
        }
        .order-product-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;
        }
        .order-filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }
        .cart-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid #eee;
        }
        .cart-item-image {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
            margin-right: 1rem;
        }
        .cart-item-info {
            flex: 1;
        }
        .quantity-control {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .qty-btn {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background: #6c5ce7;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
}

function setupEventListeners() {
    // Navegación
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            showSection(section);
        });
    });

    // Carrito
    if (elements.cartIcon) {
        elements.cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showModal(elements.cartModal);
        });
    }
    
    if (elements.checkoutBtn) {
        elements.checkoutBtn.addEventListener('click', checkout);
    }
    
    // Botones de autenticación
    elements.loginBtn.addEventListener('click', () => showModal(elements.loginModal));
    elements.registerBtn.addEventListener('click', () => showModal(elements.registerModal));
    elements.logoutBtn.addEventListener('click', logout);

    // Toggle de navegación móvil
    elements.navToggle.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.toggle('active');
    });

    // Filtros de productos
    elements.categoryFilter.addEventListener('change', () => {
        currentPage = 1;
        loadProducts();
    });
    elements.platformFilter.addEventListener('change', () => {
        currentPage = 1;
        loadProducts();
    });
    elements.searchBtn.addEventListener('click', () => {
        currentPage = 1;
        loadProducts();
    });
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentPage = 1;
            loadProducts();
        }
    });

    // Botón añadir producto
    if (elements.addProductBtn) {
        elements.addProductBtn.addEventListener('click', () => showAddProductModal());
    }

    // Panel de administrador
    if (elements.adminUsersBtn) {
        elements.adminUsersBtn.addEventListener('click', () => {
            setActiveAdminTab('users');
            loadUsers();
        });
    }
    
    if (elements.adminOrdersBtn) {
        elements.adminOrdersBtn.addEventListener('click', () => {
            setActiveAdminTab('orders');
            loadOrders();
        });
    }

    // Formularios
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    if (elements.productForm) {
        elements.productForm.addEventListener('submit', handleProductSubmit);
    }

    // Chat
    if (elements.messageInput) {
        elements.messageInput.addEventListener('input', handleTyping);
        elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    if (elements.sendMessageBtn) {
        elements.sendMessageBtn.addEventListener('click', sendMessage);
    }

    // Cerrar modales
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            hideAllModals();
        });
    });

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideAllModals();
        }
    });

    // Enlaces entre modales
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllModals();
        showModal(elements.registerModal);
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllModals();
        showModal(elements.loginModal);
    });

    if (document.getElementById('cancelProductBtn')) {
        document.getElementById('cancelProductBtn').addEventListener('click', () => {
            hideAllModals();
        });
    }
}

// Navegación entre secciones
function showSection(sectionName) {
    elements.sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Si es la sección de chat, inicializar socket si está autenticado
        if (sectionName === 'chat' && currentUser) {
            initializeChat();
        }
        
        // Si es la sección de productos, recargar
        if (sectionName === 'products') {
            loadProducts();
        }
        
        // Si es la sección de administrador, cargar contenido
        if (sectionName === 'admin' && currentUser && currentUser.role === 'admin') {
            loadAdminContent();
        }
        
        updateURL(sectionName);
    }
}

// Función para mostrar el modal del carrito
function showCartModal() {
    updateCartUI();
    showModal(elements.cartModal);
}

// Autenticación
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        updateAuthUI(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateAuthUI(true);
            
            // Si estamos en la sección de chat, inicializar socket
            if (document.getElementById('chat')?.classList.contains('active')) {
                initializeChat();
            }
        } else {
            localStorage.removeItem('token');
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        localStorage.removeItem('token');
        updateAuthUI(false);
    }
    async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        updateAuthUI(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            
            // VERIFICAR ROL ACTUALIZADO DESDE localStorage
            const users = getUsersFromLocalStorage();
            const storedUser = users.find(u => u._id === currentUser.id || u.username === currentUser.username);
            if (storedUser && storedUser.role !== currentUser.role) {
                currentUser.role = storedUser.role;
            }
            
            updateAuthUI(true);
            
            // Si estamos en la sección de chat, inicializar socket
            if (document.getElementById('chat')?.classList.contains('active')) {
                initializeChat();
            }
        } else {
            localStorage.removeItem('token');
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        localStorage.removeItem('token');
        updateAuthUI(false);
        }
    }
}

function updateAuthUI(isAuthenticated) {
    if (isAuthenticated) {
        elements.authButtons.style.display = 'none';
        elements.userMenu.style.display = 'flex';
        elements.userGreeting.textContent = `Hola, ${currentUser.username}`;
        
        // Mostrar panel de administrador si es admin
        if (currentUser.role === 'admin' && elements.adminPanel) {
            elements.adminPanel.style.display = 'block';
        } else if (elements.adminPanel) {
            elements.adminPanel.style.display = 'none';
        }
        
        // Mostrar botón de añadir producto si es admin
        if (currentUser.role === 'admin' && elements.addProductBtn) {
            elements.addProductBtn.style.display = 'block';
        } else if (elements.addProductBtn) {
            elements.addProductBtn.style.display = 'none';
        }
        
        // Habilitar chat
        if (elements.messageInput) elements.messageInput.disabled = false;
        if (elements.sendMessageBtn) elements.sendMessageBtn.disabled = false;
        
        // Actualizar carrito
        updateCartUI();
        
        // Si está en la sección de administrador y es admin, cargar contenido
        if (document.getElementById('admin')?.classList.contains('active') && currentUser.role === 'admin') {
            loadAdminContent();
        }
    } else {
        elements.authButtons.style.display = 'flex';
        elements.userMenu.style.display = 'none';
        
        // Ocultar panel de administrador
        if (elements.adminPanel) elements.adminPanel.style.display = 'none';
        
        // Ocultar botón de añadir producto
        if (elements.addProductBtn) elements.addProductBtn.style.display = 'none';
        
        // Deshabilitar chat
        if (elements.messageInput) elements.messageInput.disabled = true;
        if (elements.sendMessageBtn) elements.sendMessageBtn.disabled = true;
        
        // Limpiar carrito temporal
        cart = [];
        updateCartUI();
        
        // Limpiar mensajes del chat
        if (elements.chatMessages) {
            elements.chatMessages.innerHTML = `
                <div class="welcome-message">
                    <p>Bienvenido al chat! Inicia sesión para unirte a la conversación.</p>
                </div>
            `;
        }
        
        // Desconectar socket si existe
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Validación básica
    if (!username || !password) {
        showNotification('Usuario y contraseña son requeridos', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI(true);
            hideAllModals();
            showNotification('Login exitoso', 'success');
            
            // Guardar usuario en localStorage para registro
            saveUserToLocalStorage(data.user);
            
            // Limpiar formulario
            elements.loginForm.reset();
            
            // Recargar productos para mostrar botones de admin
            loadProducts();
            
            // Si estamos en la sección de chat, inicializar socket
            if (document.getElementById('chat')?.classList.contains('active')) {
                initializeChat();
            }
            
            // Recargar carrito (si hay uno persistido para este usuario)
            loadCart();
            
            // Recargar pedidos del usuario
            loadOrdersFromStorage();
        } else {
            showNotification(data.message || 'Error en el login', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error en login:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validaciones
    if (!username || !password) {
        showNotification('Usuario y contraseña son requeridos', 'error');
        return;
    }
    
    if (username.length < 3) {
        showNotification('El usuario debe tener al menos 3 caracteres', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar usuario en localStorage
            const newUser = {
                _id: data.user._id || Date.now().toString(),
                username: username,
                role: 'user' // Por defecto todos los usuarios registrados son 'user'
            };
            saveUserToLocalStorage(newUser);
            
            showNotification('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
            hideAllModals();
            // Limpiar formulario
            elements.registerForm.reset();
            showModal(elements.loginModal);
        } else {
            showNotification(data.message || 'Error en el registro', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error en registro:', error);
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateAuthUI(false);
    showNotification('Sesión cerrada', 'info');
    loadProducts(); // Recargar para ocultar botones de admin
    
    // Desconectar socket
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

// Gestión de productos
async function loadProducts(page = currentPage) {
    const category = elements.categoryFilter.value;
    const platform = elements.platformFilter.value;
    const search = elements.searchInput.value;
    
    let url = `${API_BASE}/products?page=${page}&limit=12`;
    if (category) url += `&category=${category}`;
    if (platform) url += `&platform=${platform}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    try {
        if (elements.productsGrid) {
            elements.productsGrid.innerHTML = '<div class="spinner"></div>';
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            displayProducts(data.products);
            currentPage = data.currentPage;
            totalPages = data.totalPages;
            setupPagination(data.total, data.currentPage, data.totalPages);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        if (elements.productsGrid) {
            elements.productsGrid.innerHTML = `
                <div class="text-center">
                    <p>Error al cargar los productos. Intenta nuevamente.</p>
                </div>
            `;
        }
    }
}

function displayProducts(products) {
    if (!elements.productsGrid) return;
    
    if (products.length === 0) {
        elements.productsGrid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 2rem;">
                <p>No se encontraron productos.</p>
                ${currentUser && currentUser.role === 'admin' ? 
                    '<button class="btn btn-warning mt-2" onclick="showAddProductModal()">Añadir primer producto</button>' : 
                    ''}
            </div>
        `;
        return;
    }
    
    elements.productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.featured ? '<span class="featured-badge"><i class="fas fa-star"></i> Destacado</span>' : ''}
            <img src="${product.imageUrl}" alt="${product.name}" class="product-image" 
                 onerror="this.src='https://via.placeholder.com/300x200/6c5ce7/ffffff?text=Imagen+No+Disponible'">
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <span class="product-price">${product.price.toFixed(2)}€</span>
                    <span class="product-rating">
                        <i class="fas fa-star"></i> ${product.rating}/5
                    </span>
                </div>
                <div class="product-meta">
                    <span class="product-platform">${product.platform}</span>
                    <button class="btn btn-primary" onclick="addToCart('${product._id}', '${product.name}', ${product.price}, '${product.imageUrl}')">
                        <i class="fas fa-shopping-cart"></i> Añadir al carrito
                    </button>
                </div>
                ${currentUser && currentUser.role === 'admin' ? `
                    <div class="product-actions">
                        <button class="btn btn-edit" onclick="editProduct('${product._id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger" onclick="deleteProduct('${product._id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Función para depurar productos
window.debugProducts = async function() {
    console.log('🔍 Depuración de productos:');
    
    try {
        const response = await fetch(`${API_BASE}/products`);
        const data = await response.json();
        
        if (data.success) {
            console.log(`📊 Total productos: ${data.products.length}`);
            console.log('📋 Lista de productos con plataformas:');
            
            data.products.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name}`);
                console.log(`   Plataforma: ${product.platform}`);
                console.log(`   Categoría: ${product.category}`);
                console.log(`   Precio: ${product.price}€`);
                console.log('---');
            });
            
            // Agrupar por plataforma
            const platforms = {};
            data.products.forEach(product => {
                if (!platforms[product.platform]) {
                    platforms[product.platform] = 0;
                }
                platforms[product.platform]++;
            });
            
            console.log('📊 Productos por plataforma:');
            Object.keys(platforms).forEach(platform => {
                console.log(`   ${platform}: ${platforms[platform]} productos`);
            });
            
        } else {
            console.error('❌ Error en la respuesta:', data.message);
        }
    } catch (error) {
        console.error('💥 Error en depuración:', error);
    }
};

function setupPagination(total, currentPage, totalPages) {
    if (!elements.pagination) return;
    
    if (totalPages <= 1) {
        elements.pagination.innerHTML = '';
        return;
    }
    
    elements.pagination.innerHTML = `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Anterior
        </button>
        <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${currentPage + 1})">
            Siguiente <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadProducts(page);
    }
}

// Gestión de productos (admin)
function showAddProductModal() {
    if (!elements.productModal) return;
    
    document.getElementById('productModalTitle').textContent = 'Añadir Videojuego';
    elements.productForm.reset();
    elements.productForm.dataset.mode = 'add';
    delete elements.productForm.dataset.productId;
    showModal(elements.productModal);
}

async function editProduct(productId) {
    try {
        console.log(`📝 Editando producto ${productId}`);
        
        const response = await fetch(`${API_BASE}/products/${productId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al cargar producto');
        }
        
        const product = data.product;
        console.log('📋 Producto cargado:', product);
        
        document.getElementById('productModalTitle').textContent = 'Editar Videojuego';
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productRating').value = product.rating;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPlatform').value = product.platform;
        document.getElementById('productImageUrl').value = product.imageUrl;
        document.getElementById('productFeatured').checked = product.featured;
        
        // Actualizar texto del botón de envío
        const submitButton = document.querySelector('#productForm button[type="submit"] span');
        if (submitButton) {
            submitButton.textContent = 'Actualizar Producto';
        }
        
        elements.productForm.dataset.mode = 'edit';
        elements.productForm.dataset.productId = productId;
        showModal(elements.productModal);
        
    } catch (error) {
        console.error('❌ Error cargando producto:', error);
        showNotification(`Error al cargar el producto: ${error.message}`, 'error');
    }
}
async function handleProductSubmit(e) {
    e.preventDefault();
    console.log('🔄 Enviando formulario de producto...');
    
    // Obtener valores del formulario
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const platform = document.getElementById('productPlatform').value;
    const imageUrl = document.getElementById('productImageUrl').value;
    const rating = parseFloat(document.getElementById('productRating').value) || 0;
    const featured = document.getElementById('productFeatured').checked;
    
    console.log('📋 Datos del formulario:', {
        name, description, price, category, platform, imageUrl, rating, featured
    });
    
    // Validación mejorada
    const errors = [];
    
    if (!name || name.trim().length === 0) {
        errors.push('El nombre es requerido');
    }
    
    if (!description || description.trim().length === 0) {
        errors.push('La descripción es requerida');
    }
    
    if (!price || isNaN(price) || price <= 0) {
        errors.push('El precio debe ser un número mayor que 0');
    }
    
    if (!category || category.trim().length === 0) {
        errors.push('La categoría es requerida');
    }
    
    if (!platform || platform.trim().length === 0) {
        errors.push('La plataforma es requerida');
    }
    
    if (!imageUrl || imageUrl.trim().length === 0) {
        errors.push('La URL de la imagen es requerida');
    }
    
    if (rating < 0 || rating > 5) {
        errors.push('La calificación debe estar entre 0 y 5');
    }
    
    if (errors.length > 0) {
        showNotification(`Errores de validación: ${errors.join(', ')}`, 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('No estás autenticado', 'error');
        return;
    }
    
    // Preparar datos para enviar
    const formData = {
        name: name.trim(),
        description: description.trim(),
        price: price,
        category: category,
        platform: platform,
        imageUrl: imageUrl.trim(),
        rating: rating,
        featured: featured
    };
    
    console.log('📤 Datos a enviar al servidor:', formData);
    
    const mode = elements.productForm.dataset.mode;
    const productId = elements.productForm.dataset.productId;
    
    try {
        const url = mode === 'edit' ? `${API_BASE}/products/${productId}` : `${API_BASE}/products`;
        const method = mode === 'edit' ? 'PUT' : 'POST';
        
        console.log(`📡 Enviando ${method} a ${url}`);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);
        
        if (response.ok) {
            hideAllModals();
            showNotification(
                mode === 'edit' ? '✅ Producto actualizado exitosamente' : '✅ Producto añadido exitosamente',
                'success'
            );
            loadProducts();
        } else {
            // Mostrar errores detallados del servidor
            let errorMessage = data.message || 'Error al guardar el producto';
            
            if (data.errors) {
                // Si hay múltiples errores, mostrarlos todos
                const errorDetails = Object.values(data.errors).map(err => err.message || err).join(', ');
                errorMessage += `: ${errorDetails}`;
            }
            
            showNotification(`❌ ${errorMessage}`, 'error');
            
            // Mostrar detalles en consola
            console.error('❌ Error del servidor:', {
                status: response.status,
                statusText: response.statusText,
                data: data
            });
        }
    } catch (error) {
        console.error('💥 Error de conexión:', error);
        showNotification('❌ Error de conexión con el servidor', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('No estás autenticado', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showNotification('Producto eliminado exitosamente', 'success');
            loadProducts();
        } else {
            const data = await response.json();
            console.error('❌ Error del servidor:', data);
            showNotification(data.message || 'Error al eliminar el producto', 'error');
        }
    } catch (error) {
        console.error('💥 Error eliminando producto:', error);
        showNotification('Error de conexión', 'error');
    }
}

// Gestión del carrito - CORREGIDO
function addToCart(productId, name, price, imageUrl) {
    if (!currentUser) {
        showNotification('Inicia sesión para añadir al carrito', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: price,
            imageUrl: imageUrl,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification('Producto añadido al carrito', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showNotification('Producto eliminado del carrito', 'info');
}

function updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart();
        updateCartUI();
    }
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
    showNotification('Carrito vaciado', 'info');
}

function saveCart() {
    if (currentUser) {
        localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    } else {
        localStorage.setItem('guestCart', JSON.stringify(cart));
    }
}

function loadCart() {
    let savedCart = [];
    
    if (currentUser) {
        savedCart = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`)) || [];
    } else {
        savedCart = JSON.parse(localStorage.getItem('guestCart')) || [];
    }
    
    // Asegurarse de que los objetos del carrito tengan el formato correcto
    cart = savedCart.map(item => ({
        id: item.id || item.productId, // Compatibilidad con formato anterior
        name: item.name,
        price: parseFloat(item.price),
        imageUrl: item.imageUrl,
        quantity: parseInt(item.quantity) || 1
    }));
    
    updateCartUI();
}

function updateCartUI() {
    // Calcular el total correctamente
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Actualizar contador
    if (elements.cartCount) {
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        elements.cartCount.textContent = itemCount;
    }
    
    // Actualizar dropdown del carrito
    if (elements.cartItems) {
        if (cart.length === 0) {
            elements.cartItems.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                </div>
            `;
        } else {
            elements.cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity}</div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <span class="qty-value">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                        <button class="btn btn-danger" onclick="removeFromCart('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Actualizar total en dropdown
        if (elements.cartTotal) {
            elements.cartTotal.textContent = `$${total.toFixed(2)}`;
        }
    }
    
    // Actualizar modal del carrito
    if (elements.cartItemsModal) {
        if (cart.length === 0) {
            elements.cartItemsModal.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                </div>
            `;
        } else {
            elements.cartItemsModal.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity}</div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <span class="qty-value">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                        <button class="btn btn-danger" onclick="removeFromCart('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Actualizar total en modal
        if (elements.cartTotalModal) {
            elements.cartTotalModal.textContent = `$${total.toFixed(2)}`;
        }
    }
}

// Función de checkout CORREGIDA
async function checkout() {
    if (cart.length === 0) {
        showNotification('El carrito está vacío', 'error');
        return;
    }
    
    if (!currentUser) {
        showNotification('Inicia sesión para realizar la compra', 'error');
        return;
    }
    
    try {
        // Calcular el total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Mostrar procesamiento
        showNotification('Procesando tu compra...', 'info');
        
        // Simular creación de pedido
        const order = {
            id: Date.now().toString(), // ID único basado en timestamp
            userId: currentUser.id,
            username: currentUser.username,
            products: [...cart], // Copiar los productos del carrito
            total: total,
            status: 'pending', // Estado inicial: pendiente
            date: new Date().toISOString(),
            createdAt: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        // Agregar el pedido a la lista
        orders.push(order);
        
        // Guardar pedidos en localStorage
        saveOrdersToStorage();
        
        // Mostrar mensaje de éxito
        setTimeout(() => {
            showNotification('¡Compra realizada con éxito!', 'success');
            // Mostrar resumen de la compra
            const productNames = cart.map(item => `${item.name} (x${item.quantity})`).join(', ');
            const message = `Pedido #${order.id} creado: ${productNames}. Total: $${total.toFixed(2)}`;
            showNotification(message, 'info');
            
            // Limpiar el carrito
            clearCart();
            
            // Cerrar modales si están abiertos
            hideAllModals();
            
            // Recargar la vista de pedidos si estamos en la sección de admin
            if (currentUser.role === 'admin' && document.getElementById('admin')?.classList.contains('active')) {
                loadOrders();
            }
        }, 1500);
    } catch (error) {
        console.error('Error en checkout:', error);
        showNotification('Error al procesar la compra', 'error');
    }
}

// Gestión de pedidos
function loadOrdersFromStorage() {
    try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        } else {
            orders = []; // Inicializar array vacío si no hay pedidos
        }
    } catch (error) {
        console.error('Error cargando pedidos desde localStorage:', error);
        orders = [];
    }
}

function saveOrdersToStorage() {
    try {
        localStorage.setItem('orders', JSON.stringify(orders));
    } catch (error) {
        console.error('Error guardando pedidos en localStorage:', error);
    }
}

function displayOrders(ordersList) {
    if (!elements.adminContent) return;
    
    // Filtrar pedidos según el filtro seleccionado
    let filteredOrders = ordersList;
    if (orderFilter === 'pending') {
        filteredOrders = ordersList.filter(order => order.status === 'pending');
    } else if (orderFilter === 'completed') {
        filteredOrders = ordersList.filter(order => order.status === 'completed');
    }
    
    if (filteredOrders.length === 0) {
        elements.adminContent.innerHTML = `
            <h3>Gestión de Pedidos</h3>
            <div class="order-filters">
                <button class="btn ${orderFilter === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="setOrderFilter('all')">Todos</button>
                <button class="btn ${orderFilter === 'pending' ? 'btn-primary' : 'btn-outline'}" onclick="setOrderFilter('pending')">En curso</button>
                <button class="btn ${orderFilter === 'completed' ? 'btn-primary' : 'btn-outline'}" onclick="setOrderFilter('completed')">Comprados</button>
            </div>
            <p>No hay pedidos ${orderFilter !== 'all' ? 'con este filtro' : ''}.</p>
        `;
        return;
    }
    
    elements.adminContent.innerHTML = `
        <h3>Gestión de Pedidos</h3>
        <div class="order-filters">
            <button class="btn ${orderFilter === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="setOrderFilter('all')">Todos</button>
            <button class="btn ${orderFilter === 'pending' ? 'btn-primary' : 'btn-outline'}" onclick="setOrderFilter('pending')">En curso</button>
            <button class="btn ${orderFilter === 'completed' ? 'btn-primary' : 'btn-outline'}" onclick="setOrderFilter('completed')">Comprados</button>
        </div>
        <div class="admin-orders-list">
            ${filteredOrders.map(order => `
                <div class="admin-order" id="order-${order.id}">
                    <div class="order-header">
                        <h4>Pedido #${order.id}</h4>
                        <span class="order-status ${order.status === 'pending' ? 'status-pending' : 'status-completed'}">
                            ${order.status === 'pending' ? 'En curso' : 'Comprado'}
                        </span>
                    </div>
                    <p><strong>Usuario:</strong> ${order.username} (ID: ${order.userId})</p>
                    <p><strong>Fecha:</strong> ${order.createdAt}</p>
                    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                    <p><strong>Productos:</strong> ${order.products.length} item(s)</p>
                    <button class="btn btn-outline btn-sm" onclick="toggleOrderDetails('${order.id}')">
                        <i class="fas fa-${getOrderDetailsState(order.id) ? 'minus' : 'plus'}"></i> Ver detalles
                    </button>
                    <div class="order-details ${getOrderDetailsState(order.id) ? 'active' : ''}" id="details-${order.id}">
                        <h5>Detalles del pedido:</h5>
                        <div class="order-products">
                            ${order.products.map(product => `
                                <div class="order-product-item">
                                    <div>
                                        <strong>${product.name}</strong><br>
                                        <small>Cantidad: ${product.quantity} | Precio: $${product.price.toFixed(2)} c/u</small>
                                    </div>
                                    <div>
                                        <strong>$${(product.price * product.quantity).toFixed(2)}</strong>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <p><strong>Subtotal:</strong> $${order.total.toFixed(2)}</p>
                    </div>
                    ${order.status === 'pending' ? `
                        <div style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="completeOrder('${order.id}')">
                                <i class="fas fa-check"></i> Marcar como completado
                            </button>
                            <button class="btn btn-danger" onclick="deleteOrder('${order.id}')" style="margin-left: 0.5rem;">
                                <i class="fas fa-trash"></i> Eliminar pedido
                            </button>
                        </div>
                    ` : `
                        <div style="margin-top: 1rem;">
                            <button class="btn btn-outline" onclick="setOrderPending('${order.id}')">
                                <i class="fas fa-undo"></i> Volver a "En curso"
                            </button>
                            <button class="btn btn-danger" onclick="deleteOrder('${order.id}')" style="margin-left: 0.5rem;">
                                <i class="fas fa-trash"></i> Eliminar pedido
                            </button>
                        </div>
                    `}
                </div>
            `).join('')}
        </div>
    `;
}

function loadOrders() {
    if (!currentUser || currentUser.role !== 'admin' || !elements.adminContent) return;
    
    try {
        // Cargar pedidos desde localStorage
        loadOrdersFromStorage();
        
        // Mostrar los pedidos
        displayOrders(orders);
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        elements.adminContent.innerHTML = '<p>Error de conexión al cargar pedidos</p>';
    }
}

function setOrderFilter(filter) {
    orderFilter = filter;
    loadOrders();
}

function toggleOrderDetails(orderId) {
    const detailsElement = document.getElementById(`details-${orderId}`);
    const button = document.querySelector(`#order-${orderId} button[onclick="toggleOrderDetails('${orderId}')"]`);
    if (detailsElement) {
        const isActive = detailsElement.classList.contains('active');
        detailsElement.classList.toggle('active');
        // Actualizar el icono del botón
        if (button) {
            button.innerHTML = `<i class="fas fa-${isActive ? 'plus' : 'minus'}"></i> Ver detalles`;
        }
        // Guardar el estado en localStorage
        const orderDetailsState = JSON.parse(localStorage.getItem('orderDetailsState') || '{}');
        orderDetailsState[orderId] = !isActive;
        localStorage.setItem('orderDetailsState', JSON.stringify(orderDetailsState));
    }
}

function getOrderDetailsState(orderId) {
    const orderDetailsState = JSON.parse(localStorage.getItem('orderDetailsState') || '{}');
    return orderDetailsState[orderId] || false;
}

function completeOrder(orderId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    if (!confirm('¿Seguro que quieres marcar este pedido como completado?')) {
        return;
    }
    
    try {
        // Encontrar y actualizar el pedido
        const orderIndex = orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].status = 'completed';
            orders[orderIndex].completedAt = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Guardar cambios
            saveOrdersToStorage();
            showNotification('Pedido marcado como completado', 'success');
            loadOrders(); // Recargar la lista
        }
    } catch (error) {
        console.error('Error actualizando pedido:', error);
        showNotification('Error al actualizar el pedido', 'error');
    }
}

function setOrderPending(orderId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    if (!confirm('¿Seguro que quieres volver a marcar este pedido como "En curso"?')) {
        return;
    }
    
    try {
        // Encontrar y actualizar el pedido
        const orderIndex = orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].status = 'pending';
            delete orders[orderIndex].completedAt;
            
            // Guardar cambios
            saveOrdersToStorage();
            showNotification('Pedido marcado como "En curso"', 'success');
            loadOrders(); // Recargar la lista
        }
    } catch (error) {
        console.error('Error actualizando pedido:', error);
        showNotification('Error al actualizar el pedido', 'error');
    }
}

function deleteOrder(orderId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        // Filtrar el pedido a eliminar
        orders = orders.filter(order => order.id !== orderId);
        
        // Guardar cambios
        saveOrdersToStorage();
        showNotification('Pedido eliminado exitosamente', 'success');
        loadOrders(); // Recargar la lista
    } catch (error) {
        console.error('Error eliminando pedido:', error);
        showNotification('Error al eliminar el pedido', 'error');
    }
}

// Gestión de usuarios (admin) - AHORA CON USUARIOS REALES
function saveUserToLocalStorage(user) {
    try {
        let users = JSON.parse(localStorage.getItem('app_users') || '[]');
        // Verificar si el usuario ya existe
        const existingUserIndex = users.findIndex(u => u._id === user._id || u.username === user.username);
        if (existingUserIndex !== -1) {
            // Actualizar usuario existente
            users[existingUserIndex] = {
                ...users[existingUserIndex],
                ...user,
                // Mantener el rol original si no se especifica uno nuevo
                role: user.role || users[existingUserIndex].role || 'user'
            };
        } else {
            // Agregar nuevo usuario
            users.push({
                _id: user._id || Date.now().toString(),
                username: user.username,
                role: user.role || 'user'
            });
        }
        localStorage.setItem('app_users', JSON.stringify(users));
    } catch (error) {
        console.error('Error guardando usuario en localStorage:', error);
    }
}

function getUsersFromLocalStorage() {
    try {
        return JSON.parse(localStorage.getItem('app_users') || '[]');
    } catch (error) {
        console.error('Error obteniendo usuarios de localStorage:', error);
        return [];
    }
}

function getUserFromLocalStorage(userId) {
    const users = getUsersFromLocalStorage();
    return users.find(user => user._id === userId);
}

async function loadUsers() {
    if (!currentUser || currentUser.role !== 'admin' || !elements.adminContent) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('No estás autenticado', 'error');
        return;
    }
    
    try {
        elements.adminContent.innerHTML = `
            <h3>Gestión de Usuarios</h3>
            <div class="spinner"></div>
            <p>Cargando usuarios...</p>
        `;
        
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error en la respuesta del servidor');
        }
        
        displayUsers(data);
        
    } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
        
        const localUsers = getUsersFromLocalStorage();
        if (localUsers.length > 0) {
            displayUsers(localUsers);
            showNotification('Usando datos locales. Error al conectar con el servidor.', 'warning');
        } else {
            elements.adminContent.innerHTML = `
                <h3>Gestión de Usuarios</h3>
                <div class="alert alert-error">
                    <h4>Error al cargar usuarios</h4>
                    <p>${error.message || 'Error desconocido'}</p>
                    <p><small>Verifica que el servidor esté corriendo y que tengas conexión.</small></p>
                </div>
            `;
        }
    }
}

function displayUsers(usersData) {
    if (!elements.adminContent) return;
    
    let users = [];
    
    if (usersData && usersData.users && Array.isArray(usersData.users)) {
        users = usersData.users;
    } else if (Array.isArray(usersData)) {
        users = usersData;
    } else {
        elements.adminContent.innerHTML = `
            <h3>Gestión de Usuarios</h3>
            <div class="alert alert-error">
                <p>Error: Formato de datos inválido</p>
            </div>
        `;
        return;
    }
    
    const filteredUsers = users.filter(user => {
        return user._id !== currentUser.id && user._id !== currentUser._id;
    });
    
    if (filteredUsers.length === 0) {
        elements.adminContent.innerHTML = `
            <h3>Gestión de Usuarios</h3>
            <p>No hay otros usuarios en el sistema.</p>
        `;
        return;
    }
    
    elements.adminContent.innerHTML = `
        <h3>Gestión de Usuarios (${filteredUsers.length} usuarios)</h3>
        <div class="admin-users-list">
            ${filteredUsers.map(user => `
                <div class="admin-user" id="user-${user._id}">
                    <div>
                        <strong>${user.username}</strong><br>
                        <small>ID: ${user._id}</small><br>
                        <small>Rol: <span class="role-badge ${user.role}">${user.role}</span></small><br>
                        <small>Registrado: ${new Date(user.createdAt).toLocaleDateString('es-ES')}</small>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-edit" onclick="editUser('${user._id}', '${user.username}', '${user.role}')">
                            <i class="fas fa-edit"></i> ${user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                        </button>
                        <button class="btn btn-danger" onclick="deleteUser('${user._id}', '${user.username}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}
async function editUser(userId, username, role) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    if (currentUser.id === userId || currentUser._id === userId) {
        showNotification('No puedes cambiar tu propio rol', 'error');
        return;
    }
    
    const newRole = role === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`¿Seguro que quieres cambiar el rol de "${username}" de ${role} a ${newRole}?`)) {
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('No estás autenticado', 'error');
        return;
    }
    
    try {
        console.log(`🔄 Actualizando rol de usuario ${userId} a ${newRole}`);
        
        const response = await fetch(`/api/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status} al actualizar rol`);
        }
        
        function getUsersFromLocalStorage() {
    try {
        const usersStr = localStorage.getItem('app_users');
        if (!usersStr) return [];
        
        const users = JSON.parse(usersStr);
        return Array.isArray(users) ? users : [];
    } catch (error) {
        console.error('Error obteniendo usuarios de localStorage:', error);
        return [];
    }
}
        
        showNotification(data.message || `Rol de ${username} actualizado a ${newRole}`, 'success');
        
        loadUsers();
        
        if (currentUser && (currentUser.id === userId || currentUser._id === userId)) {
            setTimeout(() => {
                showNotification('Tu rol ha sido cambiado. Recarga la página para ver los cambios completos.', 'warning');
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Error actualizando usuario:', error);
        showNotification(error.message || 'Error al actualizar el usuario', 'error');
    }
}

// Agregar esta función para manejar actualizaciones de rol
function handleRoleUpdate(newRole) {
    if (!currentUser) return;
    
    currentUser.role = newRole;
    
    // Guardar en localStorage temporal (si es necesario)
    const token = localStorage.getItem('token');
    if (token) {
        // Actualizar datos en localStorage o sessionStorage
        sessionStorage.setItem('currentUserRole', newRole);
    }
    
    // Actualizar UI inmediatamente
    updateAuthUI(true);
    
    // Recargar secciones específicas
    if (document.getElementById('products')?.classList.contains('active')) {
        loadProducts();
    }
    
    if (document.getElementById('admin')?.classList.contains('active')) {
        loadAdminContent();
    }
    
    showNotification(`Tu rol ha sido actualizado a ${newRole}`, 'info');
}

async function deleteUser(userId, username) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    if (currentUser.id === userId || currentUser._id === userId) {
        showNotification('No puedes eliminarte a ti mismo', 'error');
        return;
    }
    
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('No estás autenticado', 'error');
        return;
    }
    
    try {
        console.log(`🗑️ Eliminando usuario ${userId} (${username})`);
        
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status} al eliminar usuario`);
        }
        
        let users = getUsersFromLocalStorage();
        users = users.filter(user => user._id !== userId);
        localStorage.setItem('app_users', JSON.stringify(users));
        
        showNotification(data.message || `Usuario "${username}" eliminado exitosamente`, 'success');
        
        setTimeout(() => {
            loadUsers();
        }, 500);
        
    } catch (error) {
        console.error('❌ Error eliminando usuario:', error);
        showNotification(error.message || 'Error al eliminar el usuario', 'error');
    }
}


function loadAdminContent() {
    if (!currentUser || currentUser.role !== 'admin' || !elements.adminContent) return;
    
    elements.adminContent.innerHTML = `
        <div class="admin-tabs">
            <button class="admin-tab active" id="adminUsersBtn">Usuarios</button>
            <button class="admin-tab" id="adminOrdersBtn">Pedidos</button>
        </div>
        <div id="adminContent">
            <p>Selecciona una pestaña para gestionar usuarios o pedidos</p>
        </div>
    `;
    
    document.getElementById('adminUsersBtn').addEventListener('click', () => {
        setActiveAdminTab('users');
        loadUsers();
    });
    
    document.getElementById('adminOrdersBtn').addEventListener('click', () => {
        setActiveAdminTab('orders');
        loadOrders();
    });
    
    // Cargar usuarios por defecto
    loadUsers();
}

function setActiveAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (tab === 'users') {
        document.getElementById('adminUsersBtn').classList.add('active');
    } else if (tab === 'orders') {
        document.getElementById('adminOrdersBtn').classList.add('active');
    }
}

// Chat en tiempo real
function initializeChat() {
    if (!currentUser || !elements.chatMessages) return;
    
    // Desconectar socket existente si hay uno
    if (socket) {
        socket.disconnect();
    }
    
    // Conectar nuevo socket
    socket = io();
    
    // Limpiar mensajes existentes
    elements.chatMessages.innerHTML = '';
    
    // Configurar event listeners del socket
    socket.on('connect', () => {
        console.log('Conectado al chat');
        
        // Unirse al chat
        socket.emit('user_joined', {
            username: currentUser.username,
            userId: currentUser.id
        });
    });
    
    socket.on('chat_message', (data) => {
        addMessageToChat(data, data.username === currentUser.username);
    });
    
    socket.on('user_typing', (users) => {
        showTypingIndicator(users);
    });
    
    socket.on('user_joined', (data) => {
        addSystemMessage(data.message);
    });
    
    socket.on('user_left', (data) => {
        addSystemMessage(data.message);
    });
    
    socket.on('system_message', (data) => {
        addSystemMessage(data.message);
    });
    
    socket.on('disconnect', () => {
        console.log('Desconectado del chat');
    });
    
    socket.on('connect_error', (error) => {
        console.error('Error de conexión al chat:', error);
        showNotification('Error al conectar con el chat', 'error');
    });
}

function addMessageToChat(data, isOwn = false) {
    if (!elements.chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${data.username}</span>
            <span class="message-time">${data.timestamp}</span>
        </div>
        <div class="message-text">${data.message}</div>
    `;
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function addSystemMessage(message) {
    if (!elements.chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.style.cssText = `
        text-align: center;
        font-style: italic;
        color: #666;
        background: transparent;
        border: none;
        margin: 0.5rem 0;
        max-width: 100%;
    `;
    messageDiv.innerHTML = `
        <div class="message-text">${message}</div>
    `;
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function sendMessage() {
    if (!elements.messageInput || !socket || !socket.connected) return;
    
    const message = elements.messageInput.value.trim();
    
    if (message) {
        socket.emit('chat_message', { message });
        elements.messageInput.value = '';
        socket.emit('typing_stop');
    }
}

let typingTimer;
function handleTyping() {
    if (!socket || !socket.connected || !elements.messageInput) return;
    
    socket.emit('typing_start');
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit('typing_stop');
    }, 1000);
}

function showTypingIndicator(users) {
    if (!elements.typingIndicator) return;
    
    if (users.length > 0) {
        const names = users.filter(username => username !== currentUser.username);
        if (names.length > 0) {
            const text = names.length === 1 ? 
                `${names[0]} está escribiendo...` : 
                `${names.join(', ')} están escribiendo...`;
            
            elements.typingIndicator.innerHTML = `<div class="typing-indicator">${text}</div>`;
            return;
        }
    }
    
    elements.typingIndicator.innerHTML = '';
}

// Utilidades
function showModal(modal) {
    hideAllModals();
    if (modal) modal.style.display = 'block';
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        if (modal) modal.style.display = 'none';
    });
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Navegación con History API
function updateURL(section) {
    const newURL = `${window.location.origin}${window.location.pathname}#${section}`;
    window.history.pushState({ section }, '', newURL);
}

// Manejar botones de navegación atrás/adelante
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.section) {
        showSection(event.state.section);
    }
});

// Cargar sección desde URL al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.replace('#', '');
    const validSections = ['home', 'products', 'chat', 'admin'];
    
    if (hash && validSections.includes(hash)) {
        showSection(hash);
    } else {
        showSection('home');
    }
    
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

// Hacer funciones globales para los event listeners
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.checkout = checkout;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.changePage = changePage;
window.showAddProductModal = showAddProductModal;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.completeOrder = completeOrder;
window.setOrderPending = setOrderPending;
window.deleteOrder = deleteOrder;
window.setOrderFilter = setOrderFilter;
window.toggleOrderDetails = toggleOrderDetails;
window.loadAdminContent = loadAdminContent;
window.showCartModal = showCartModal;