let socket = null;
let currentRoom = null;
let currentUsername = null;
let typingTimer = null;
let isTyping = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('💬 Chat inicializando...');
    initializeChat();
});

function initializeChat() {
    // Configurar nombre por defecto
    document.getElementById('usernameInput').value = 'Usuario_' + Math.floor(Math.random() * 1000);
    setupChatEventListeners();
}

function setupChatEventListeners() {
    document.getElementById('chatForm').addEventListener('submit', handleSendMessage);
    
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('input', handleTyping);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage(e);
        }
    });

    document.getElementById('roomInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') joinRoom();
    });
}

function connectSocket() {
    console.log('🔌 Conectando socket...');
    socket = io();

    socket.on('connect', () => {
        console.log('✅ Conectado al servidor de chat');
        showChatAlert('Conectado al chat', 'success');
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión:', error);
        showChatAlert('Error de conexión', 'error');
    });

    socket.on('chat message', (data) => {
        console.log('📨 Mensaje recibido:', data);
        addChatMessage(data.username, data.message, data.timestamp);
    });

    socket.on('user joined', (username) => {
        console.log('🟢 Usuario unido:', username);
        addSystemMessage(`${username} se ha unido a la sala`);
    });

    socket.on('user left', (username) => {
        console.log('🔴 Usuario salió:', username);
        addSystemMessage(`${username} ha salido de la sala`);
    });

    socket.on('user typing', (username) => {
        if (username !== currentUsername) {
            showTypingIndicator(`${username} está escribiendo...`);
        }
    });

    socket.on('user stopped typing', (username) => {
        if (username !== currentUsername) {
            hideTypingIndicator();
        }
    });

    socket.on('system message', (message) => {
        addSystemMessage(message);
    });

    socket.on('users update', (users) => {
        updateUsersList(users);
    });
}

function joinRoom() {
    const room = document.getElementById('roomInput').value.trim();
    const username = document.getElementById('usernameInput').value.trim();

    if (!room || !username) {
        showChatAlert('Ingresa nombre y sala', 'error');
        return;
    }

    if (!socket) connectSocket();

    console.log('🚪 Uniéndose a sala:', room);
    
    socket.emit('join room', { room, username });
    currentRoom = room;
    currentUsername = username;

    document.getElementById('currentRoom').innerHTML = `
        <i class="fas fa-hashtag" style="color: var(--primary);"></i>
        <strong>Sala: ${room}</strong><br>
        <small>Usuario: ${username}</small>
    `;

    document.getElementById('chatForm').style.display = 'block';
    document.getElementById('chatMessages').innerHTML = '';

    showChatAlert(`Unido a: ${room}`, 'success');
}

function handleSendMessage(e) {
    e.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message || !currentRoom || !socket) return;

    console.log('📤 Enviando mensaje:', message);

    socket.emit('room message', { room: currentRoom, message });
    messageInput.value = '';
    stopTyping();
    messageInput.focus();
}

function handleTyping() {
    if (!isTyping && currentRoom && socket) {
        isTyping = true;
        socket.emit('typing', { room: currentRoom });
    }

    clearTimeout(typingTimer);
    typingTimer = setTimeout(stopTyping, 1000);
}

function stopTyping() {
    if (isTyping && currentRoom && socket) {
        isTyping = false;
        socket.emit('stop typing', { room: currentRoom });
    }
    clearTimeout(typingTimer);
}

function addChatMessage(username, message, timestamp) {
    const chatMessages = document.getElementById('chatMessages');
    
    if (chatMessages.querySelector('.fa-comments')) {
        chatMessages.innerHTML = '';
    }

    const messageDiv = document.createElement('div');
    const isOwn = username === currentUsername;
    
    messageDiv.className = `message message-${isOwn ? 'own' : 'other'}`;
    messageDiv.innerHTML = `
        <div class="message-user">${username}</div>
        <div class="message-text">${message}</div>
        <div class="message-time">${timestamp}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    
    if (chatMessages.querySelector('.fa-comments')) {
        chatMessages.innerHTML = '';
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-system';
    messageDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator(text) {
    document.getElementById('typingIndicator').textContent = text;
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator').textContent = '';
}

function updateUsersList(users) {
    const usersContainer = document.getElementById('usersContainer');
    
    if (!users || users.length === 0) {
        usersContainer.innerHTML = '<div style="text-align: center; color: var(--gray); padding: 1rem;">No hay usuarios</div>';
        return;
    }

    usersContainer.innerHTML = '';
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-status user-online"></div>
            <span>${user}</span>
        `;
        usersContainer.appendChild(userItem);
    });
}

function showChatAlert(message, type) {
    const element = document.getElementById(type === 'error' ? 'chatError' : 'chatSuccess');
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => element.style.display = 'none', 4000);
}

function logout() {
    if (socket) socket.disconnect();
    window.location.href = '/';
}

function goBack() {
    window.location.href = '/';
}

window.joinRoom = joinRoom;
window.logout = logout;
window.goBack = goBack;

console.log('💬 Chat listo!');