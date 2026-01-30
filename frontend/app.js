// ========================================
// SACRED LIBRARY - FRONTEND APPLICATION
// Backend API Integration
// ========================================

const API_BASE = 'http://localhost:3000/api';
let currentRole = 'user';
let currentUserId = 1;

// DOM Elements
const booksGrid = document.getElementById('booksGrid');
const adminPanel = document.getElementById('adminPanel');
const borrowModal = document.getElementById('borrowModal');
const editModal = document.getElementById('editModal');
const toast = document.getElementById('toast');

// Role Switching
document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRole = btn.dataset.role;

        if (currentRole === 'admin') {
            adminPanel.style.display = 'block';
        } else {
            adminPanel.style.display = 'none';
        }

        loadBooks();
    });
});

// Load Books from API
async function loadBooks() {
    try {
        booksGrid.innerHTML = `
            <div class="loading-state">
                <div class="divine-loader"></div>
                <p>Loading sacred texts...</p>
            </div>
        `;

        const response = await fetch(`${API_BASE}/books`);
        const data = await response.json();

        if (data.success) {
            displayBooks(data.data);
        } else {
            showToast('Failed to load books', 'error');
        }
    } catch (error) {
        console.error('Error loading books:', error);
        booksGrid.innerHTML = `
            <div class="loading-state">
                <p style="color: #dc3545;">❌ Failed to connect to the server</p>
                <p style="font-size: 0.9rem; color: var(--stone-gray);">Make sure the backend is running on port 3000</p>
            </div>
        `;
    }
}

// Display Books
function displayBooks(books) {
    if (books.length === 0) {
        booksGrid.innerHTML = `
            <div class="loading-state">
                <p>📚 No books in the collection yet</p>
                <p style="font-size: 0.9rem; color: var(--stone-gray); margin-top: 1rem;">
                    ${currentRole === 'admin' ? 'Add your first book using the form above' : 'Check back later for new additions'}
                </p>
            </div>
        `;
        return;
    }

    booksGrid.innerHTML = books.map(book => `
        <div class="glass-card book-card" data-book-id="${book.id}">
            <div class="book-header">
                <h3 class="book-title">${escapeHtml(book.title)}</h3>
                <p class="book-author">by ${escapeHtml(book.author)}</p>
            </div>
            
            <div class="book-info">
                <span class="stock-badge">
                    📖 ${book.stock} ${book.stock === 1 ? 'copy' : 'copies'} available
                </span>
            </div>
            
            <div class="book-actions">
                ${currentRole === 'user' ? `
                    <button class="btn btn-primary" onclick="openBorrowModal(${book.id}, '${escapeHtml(book.title)}', ${book.stock})" ${book.stock === 0 ? 'disabled' : ''}>
                        ${book.stock > 0 ? '🙏 Borrow' : '❌ Out of Stock'}
                    </button>
                ` : ''}
                
                ${currentRole === 'admin' ? `
                    <button class="btn btn-secondary" onclick="openEditModal(${book.id}, '${escapeHtml(book.title)}', '${escapeHtml(book.author)}', ${book.stock})">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteBook(${book.id}, '${escapeHtml(book.title)}')">
                        🗑️ Delete
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Add Book (Admin)
document.getElementById('addBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const stock = parseInt(document.getElementById('bookStock').value);

    if (!title || !author) {
        showToast('Title and Author cannot be empty', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': 'admin'
            },
            body: JSON.stringify({ title, author, stock })
        });

        const data = await response.json();

        if (data.success) {
            showToast(`✨ "${title}" added to the collection!`, 'success');
            document.getElementById('addBookForm').reset();
            loadBooks();
        } else {
            showToast(data.message || 'Failed to add book', 'error');
        }
    } catch (error) {
        console.error('Error adding book:', error);
        showToast('Failed to connect to server', 'error');
    }
});

// Map instance
let borrowMap = null;
let borrowMarker = null;

// Open Borrow Modal
function openBorrowModal(bookId, title, stock) {
    if (stock === 0) {
        showToast('This book is out of stock', 'error');
        return;
    }

    document.getElementById('borrowBookInfo').innerHTML = `
        <div style="background: rgba(212, 175, 55, 0.1); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; border: 1px solid rgba(212, 175, 55, 0.3);">
            <h3 style="color: var(--gold-divine); margin-bottom: 0.5rem; font-family: var(--font-serif);">${title}</h3>
            <p style="color: var(--stone-gray); font-size: 0.9rem;">📖 ${stock} ${stock === 1 ? 'copy' : 'copies'} available</p>
        </div>
    `;

    document.getElementById('borrowForm').dataset.bookId = bookId;
    borrowModal.style.display = 'block';

    // Initialize map after modal is visible
    setTimeout(() => {
        initBorrowMap();
    }, 100);
}

// Initialize Borrow Map
function initBorrowMap() {
    // Remove existing map if any
    if (borrowMap) {
        borrowMap.remove();
    }

    // Get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Create map centered on user location
                borrowMap = L.map('borrowMap').setView([lat, lng], 15);

                // Add tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(borrowMap);

                // Add marker for user location
                borrowMarker = L.marker([lat, lng], {
                    draggable: false
                }).addTo(borrowMap);

                borrowMarker.bindPopup(`
                    <div style="text-align: center; font-family: var(--font-sans);">
                        <strong style="color: #D4AF37;">📍 Your Location</strong><br>
                        <small>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}</small>
                    </div>
                `).openPopup();

                // Add circle to show area
                L.circle([lat, lng], {
                    color: '#D4AF37',
                    fillColor: '#D4AF37',
                    fillOpacity: 0.2,
                    radius: 100
                }).addTo(borrowMap);

            },
            (error) => {
                console.error('Geolocation error:', error);
                // Default to a generic location if geolocation fails
                borrowMap = L.map('borrowMap').setView([-6.2088, 106.8456], 13);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(borrowMap);

                // Show message on map
                L.popup()
                    .setLatLng([-6.2088, 106.8456])
                    .setContent('<strong style="color: #dc3545;">⚠️ Location access denied</strong><br><small>Please enable location services</small>')
                    .openOn(borrowMap);
            }
        );
    } else {
        // Geolocation not supported
        borrowMap = L.map('borrowMap').setView([-6.2088, 106.8456], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(borrowMap);

        L.popup()
            .setLatLng([-6.2088, 106.8456])
            .setContent('<strong style="color: #dc3545;">⚠️ Geolocation not supported</strong>')
            .openOn(borrowMap);
    }
}

// Borrow Book
document.getElementById('borrowForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const bookId = parseInt(e.target.dataset.bookId);
    const userId = parseInt(document.getElementById('userId').value);

    if (!userId || userId < 1) {
        showToast('Please enter a valid user ID', 'error');
        return;
    }

    // Get user's geolocation
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'error');
        return;
    }

    showToast('📍 Getting your location...', 'success');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            try {
                const response = await fetch(`${API_BASE}/borrow`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-role': 'user',
                        'x-user-id': userId.toString()
                    },
                    body: JSON.stringify({
                        bookId,
                        latitude,
                        longitude
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showToast(`🙏 Book borrowed successfully! Location recorded.`, 'success');
                    borrowModal.style.display = 'none';
                    document.getElementById('borrowForm').reset();

                    // Clean up map
                    if (borrowMap) {
                        borrowMap.remove();
                        borrowMap = null;
                    }

                    loadBooks();
                } else {
                    showToast(data.message || 'Failed to borrow book', 'error');
                }
            } catch (error) {
                console.error('Error borrowing book:', error);
                showToast('Failed to connect to server', 'error');
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            showToast('Failed to get your location. Please enable location services.', 'error');
        }
    );
});

// Open Edit Modal
function openEditModal(id, title, author, stock) {
    document.getElementById('editBookId').value = id;
    document.getElementById('editTitle').value = title;
    document.getElementById('editAuthor').value = author;
    document.getElementById('editStock').value = stock;
    editModal.style.display = 'block';
}

// Update Book
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editBookId').value;
    const title = document.getElementById('editTitle').value.trim();
    const author = document.getElementById('editAuthor').value.trim();
    const stock = parseInt(document.getElementById('editStock').value);

    if (!title || !author) {
        showToast('Title and Author cannot be empty', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/books/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': 'admin'
            },
            body: JSON.stringify({ title, author, stock })
        });

        const data = await response.json();

        if (data.success) {
            showToast(`💫 "${title}" updated successfully!`, 'success');
            editModal.style.display = 'none';
            loadBooks();
        } else {
            showToast(data.message || 'Failed to update book', 'error');
        }
    } catch (error) {
        console.error('Error updating book:', error);
        showToast('Failed to connect to server', 'error');
    }
});

// Delete Book
async function deleteBook(id, title) {
    if (!confirm(`Are you sure you want to remove "${title}" from the collection?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/books/${id}`, {
            method: 'DELETE',
            headers: {
                'x-user-role': 'admin'
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast(`🗑️ "${title}" removed from collection`, 'success');
            loadBooks();
        } else {
            showToast(data.message || 'Failed to delete book', 'error');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        showToast('Failed to connect to server', 'error');
    }
}

// Close Modals
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        borrowModal.style.display = 'none';
        editModal.style.display = 'none';

        // Clean up map
        if (borrowMap) {
            borrowMap.remove();
            borrowMap = null;
        }
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        borrowModal.style.display = 'none';
        editModal.style.display = 'none';

        // Clean up map
        if (borrowMap) {
            borrowMap.remove();
            borrowMap = null;
        }
    }
});

// Show Toast Notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();

    // Add smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        const scrolled = window.pageYOffset;
        heroSection.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});
