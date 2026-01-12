// ===================================
// GLOBAL DEĞİŞKENLER
// ===================================
const DRIVE_DOWNLOAD_URL = 'https://drive.google.com/uc?export=download&id=';
let allBooks = [];
let filteredBooks = [];
let currentFilter = 'all';
let favorites = [];

// ===================================
// SAYFA YÜKLENDİĞİNDE
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    loadFavorites();
    loadBooks();
    setupEventListeners();
});

// ===================================
// KİTAPLARI YÜKLE
// ===================================
async function loadBooks() {
    const spinner = document.getElementById('loadingSpinner');
    const booksGrid = document.getElementById('booksGrid');
    
    try {
        const response = await fetch('books.json');
        const books = await response.json();
        
        allBooks = groupBooksByTitle(books);
        filteredBooks = allBooks;
        
        spinner.style.display = 'none';
        
        displayBooks(allBooks);
        updateStats();
        
    } catch (error) {
        console.error('Error loading books:', error);
        spinner.innerHTML = '<p class="text-danger">Error loading books. Please try again later.</p>';
    }
}

// ===================================
// KİTAPLARI BAŞLIĞA GÖRE GRUPLA
// ===================================
function groupBooksByTitle(books) {
    const grouped = {};
    
    books.forEach(book => {
        if (!grouped[book.Title]) {
            grouped[book.Title] = {
                title: book.Title,
                description: 'No description available.',
                pdf: null,
                audio: null,
                cover: null
            };
        }
        
        // Description varsa güncelle
        if (book.Description && book.Description.trim() !== "") {
            grouped[book.Title].description = book.Description;
        }
        
        if (book.Type === 'pdf') {
            grouped[book.Title].pdf = book.FileId;
        } else if (book.Type === 'audio') {
            grouped[book.Title].audio = book.FileId;
        } else if (book.Type === 'cover') {
            grouped[book.Title].cover = book.CoverFile;
        }
    });
    
    return Object.values(grouped);
}

// ===================================
// KİTAPLARI GÖSTER
// ===================================
function displayBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    const noResults = document.getElementById('noResults');
    
    booksGrid.innerHTML = '';
    
    if (books.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    books.forEach((book, index) => {
        const card = createBookCard(book, index);
        booksGrid.appendChild(card);
    });
}

// ===================================
// KİTAP KARTI OLUŞTUR
// ===================================
function createBookCard(book, index) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const isFavorite = favorites.includes(book.title);
    const coverImage = book.cover ? `covers/${book.cover}` : 'https://via.placeholder.com/300x400/667eea/ffffff?text=No+Cover';
    
    card.innerHTML = `
        <div class="book-card-image">
            <img src="${coverImage}" alt="${book.title}" loading="lazy">
            
            <div class="favorite-badge ${isFavorite ? 'active' : ''}" data-title="${book.title}">
                <i class="fas fa-heart"></i>
            </div>
            
            <div class="format-badges">
                ${book.pdf ? '<span class="format-badge pdf"><i class="fas fa-file-pdf"></i> PDF</span>' : ''}
                ${book.audio ? '<span class="format-badge audio"><i class="fas fa-headphones"></i> Audio</span>' : ''}
            </div>
        </div>
        
        <div class="book-card-body">
            <h3 class="book-card-title">${book.title}</h3>
            <p class="book-card-description">${book.description}</p>
            
            <div class="book-card-actions">
                ${book.pdf ? `<a href="${DRIVE_DOWNLOAD_URL}${book.pdf}" target="_blank" class="action-btn pdf" onclick="event.stopPropagation()"><i class="fas fa-download"></i> PDF</a>` : '<button class="action-btn pdf" disabled><i class="fas fa-times"></i> PDF</button>'}
                ${book.audio ? `<a href="${DRIVE_DOWNLOAD_URL}${book.audio}" target="_blank" class="action-btn audio" onclick="event.stopPropagation()"><i class="fas fa-download"></i> Audio</a>` : '<button class="action-btn audio" disabled><i class="fas fa-times"></i> Audio</button>'}
            </div>
        </div>
    `;
    
    card.addEventListener('click', function(e) {
        if (!e.target.closest('.favorite-badge') && !e.target.closest('.action-btn')) {
            openBookModal(book);
        }
    });
    
    const favoriteBtn = card.querySelector('.favorite-badge');
    favoriteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleFavorite(book.title);
    });
    
    return card;
}

// ===================================
// KİTAP MODALINI AÇ
// ===================================
function openBookModal(book) {
    const modal = new bootstrap.Modal(document.getElementById('bookModal'));
    const modalTitle = document.getElementById('bookModalLabel');
    const modalCoverImage = document.getElementById('modalCoverImage');
    const modalDescription = document.getElementById('modalDescription');
    const modalPdfBtn = document.getElementById('modalPdfBtn');
    const modalAudioBtn = document.getElementById('modalAudioBtn');
    const modalFavoriteBtn = document.getElementById('modalFavoriteBtn');
    
    const coverImage = book.cover ? `covers/${book.cover}` : 'https://via.placeholder.com/400x500/667eea/ffffff?text=No+Cover';
    const isFavorite = favorites.includes(book.title);
    
    modalTitle.textContent = book.title;
    modalCoverImage.src = coverImage;
    modalCoverImage.alt = book.title;
    modalDescription.textContent = book.description;
    
    if (book.pdf) {
        modalPdfBtn.href = DRIVE_DOWNLOAD_URL + book.pdf;
        modalPdfBtn.style.display = 'block';
    } else {
        modalPdfBtn.style.display = 'none';
    }
    
    if (book.audio) {
        modalAudioBtn.href = DRIVE_DOWNLOAD_URL + book.audio;
        modalAudioBtn.style.display = 'block';
    } else {
        modalAudioBtn.style.display = 'none';
    }
    
    modalFavoriteBtn.innerHTML = isFavorite 
        ? '<i class="fas fa-heart"></i> <span>Remove from Favorites</span>'
        : '<i class="fas fa-heart"></i> <span>Add to Favorites</span>';
    
    modalFavoriteBtn.onclick = function() {
        toggleFavorite(book.title);
        modal.hide();
    };
    
    modal.show();
}

// ===================================
// FAVORİLER YÖNETİMİ
// ===================================
function loadFavorites() {
    const saved = localStorage.getItem('islamicBooksGalleryFavorites');
    favorites = saved ? JSON.parse(saved) : [];
}

function saveFavorites() {
    localStorage.setItem('islamicBooksGalleryFavorites', JSON.stringify(favorites));
}

function toggleFavorite(title) {
    const index = favorites.indexOf(title);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(title);
    }
    
    saveFavorites();
    updateStats();
    
    if (currentFilter === 'favorites') {
        applyFilter('favorites');
    } else {
        displayBooks(filteredBooks);
    }
}

// ===================================
// İSTATİSTİKLERİ GÜNCELLE
// ===================================
function updateStats() {
    const totalBooks = allBooks.length;
    const totalPdf = allBooks.filter(book => book.pdf).length;
    const totalAudio = allBooks.filter(book => book.audio).length;
    const totalFavorites = favorites.length;
    
    animateNumber('totalBooks', totalBooks);
    animateNumber('totalPdf', totalPdf);
    animateNumber('totalAudio', totalAudio);
    animateNumber('totalFavorites', totalFavorites);
}

function animateNumber(elementId, targetNumber) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const steps = 30;
    const increment = targetNumber / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetNumber) {
            element.textContent = targetNumber;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

// ===================================
// EVENT LİSTENERLARI
// ===================================
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    
    searchInput.addEventListener('input', handleSearch);
    
    clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        handleSearch();
    });
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            currentFilter = filter;
            applyFilter(filter);
        });
    });
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });
    
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===================================
// ARAMA FONKSİYONU
// ===================================
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        applyFilter(currentFilter);
    } else {
        let searchResults;
        
        if (currentFilter === 'favorites') {
            searchResults = allBooks.filter(book => 
                favorites.includes(book.title) && 
                book.title.toLowerCase().includes(searchTerm)
            );
        } else if (currentFilter === 'pdf') {
            searchResults = allBooks.filter(book => 
                book.pdf && 
                book.title.toLowerCase().includes(searchTerm)
            );
        } else if (currentFilter === 'audio') {
            searchResults = allBooks.filter(book => 
                book.audio && 
                book.title.toLowerCase().includes(searchTerm)
            );
        } else if (currentFilter === 'both') {
            searchResults = allBooks.filter(book => 
                book.pdf && book.audio && 
                book.title.toLowerCase().includes(searchTerm)
            );
        } else {
            searchResults = allBooks.filter(book => 
                book.title.toLowerCase().includes(searchTerm)
            );
        }
        
        filteredBooks = searchResults;
        displayBooks(searchResults);
    }
}

// ===================================
// FİLTRE UYGULA
// ===================================
function applyFilter(filter) {
    let filtered;
    
    switch(filter) {
        case 'pdf':
            filtered = allBooks.filter(book => book.pdf);
            break;
        case 'audio':
            filtered = allBooks.filter(book => book.audio);
            break;
        case 'both':
            filtered = allBooks.filter(book => book.pdf && book.audio);
            break;
        case 'favorites':
            filtered = allBooks.filter(book => favorites.includes(book.title));
            break;
        default:
            filtered = allBooks;
    }
    
    filteredBooks = filtered;
    displayBooks(filtered);
    
    document.getElementById('searchInput').value = '';
}