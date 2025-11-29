// Google Drive URL formatları
const DRIVE_DOWNLOAD_URL = 'https://drive.google.com/uc?export=download&id=';
const DRIVE_THUMBNAIL_URL = 'https://drive.google.com/thumbnail?id=';

// Global değişkenler
let allBooks = [];
let currentSort = { column: 'no', ascending: true };

// Sayfa yüklendiğinde çalışacak
document.addEventListener('DOMContentLoaded', function() {
    loadBooks();
    setupSearch();
});

// JSON'dan kitapları yükle
async function loadBooks() {
    const spinner = document.getElementById('loadingSpinner');
    const tableContainer = document.getElementById('tableContainer');
    
    try {
        const response = await fetch('books.json');
        const books = await response.json();
        
        // Kitapları başlığa göre grupla
        allBooks = groupBooksByTitle(books);
        
        // Yükleme tamamlandı, spinner'ı gizle
        spinner.style.display = 'none';
        tableContainer.style.display = 'block';
        
        // Tabloyu oluştur
        displayBooks(allBooks);
    } catch (error) {
        console.error('Error loading books:', error);
        spinner.innerHTML = '<p class="text-danger">Error loading books. Please try again later.</p>';
    }
}

// Kitapları başlığa göre grupla
function groupBooksByTitle(books) {
    const grouped = {};
    
    books.forEach(book => {
        if (!grouped[book.Title]) {
            grouped[book.Title] = {};
        }
        grouped[book.Title][book.Type] = book.FileId;
    });
    
    return grouped;
}

// Kitapları tabloda göster
function displayBooks(booksToDisplay) {
    const tbody = document.getElementById('bookTableBody');
    tbody.innerHTML = '';
    
    // Object'i array'e çevir ve sırala
    let booksArray = Object.entries(booksToDisplay).map(([title, files], index) => ({
        no: index + 1,
        title: title,
        files: files
    }));
    
    // Sıralama uygula
    booksArray = applySorting(booksArray);
    
    // Tabloyu oluştur
    booksArray.forEach((book, index) => {
        const row = document.createElement('tr');
        
        // No
        const noCell = document.createElement('td');
        noCell.textContent = index + 1;
        row.appendChild(noCell);
        
        // Headline
        const titleCell = document.createElement('td');
        titleCell.textContent = book.title;
        titleCell.style.textAlign = 'left';
        row.appendChild(titleCell);
        
        // PDF
        const pdfCell = document.createElement('td');
        if (book.files.pdf) {
            const pdfLink = document.createElement('a');
            pdfLink.href = DRIVE_DOWNLOAD_URL + book.files.pdf;
            pdfLink.className = 'btn-download';
            pdfLink.innerHTML = '<i class="fas fa-file-pdf"></i> <span>Download</span>';
            pdfLink.target = '_blank';
            pdfCell.appendChild(pdfLink);
        } else {
            pdfCell.innerHTML = '<span class="text-muted">N/A</span>';
        }
        row.appendChild(pdfCell);
        
        // Audio
        const audioCell = document.createElement('td');
        if (book.files.audio) {
            const audioLink = document.createElement('a');
            audioLink.href = DRIVE_DOWNLOAD_URL + book.files.audio;
            audioLink.className = 'btn-download';
            audioLink.innerHTML = '<i class="fas fa-headphones"></i> <span>Download</span>';
            audioLink.target = '_blank';
            audioCell.appendChild(audioLink);
        } else {
            audioCell.innerHTML = '<span class="text-muted">N/A</span>';
        }
        row.appendChild(audioCell);
        
        // Cover
        const coverCell = document.createElement('td');
        if (book.files.cover) {
            const coverBtn = document.createElement('button');
            coverBtn.className = 'btn-cover';
            coverBtn.innerHTML = '<i class="fas fa-image"></i> <span>View</span>';
            coverBtn.onclick = () => showCoverModal(book.title, book.files.cover);
            coverCell.appendChild(coverBtn);
        } else {
            coverCell.innerHTML = '<span class="text-muted">N/A</span>';
        }
        row.appendChild(coverCell);
        
        tbody.appendChild(row);
    });
}

// Arama fonksiyonu kurulumu
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            displayBooks(allBooks);
        } else {
            const filtered = {};
            for (const [title, files] of Object.entries(allBooks)) {
                if (title.toLowerCase().includes(searchTerm)) {
                    filtered[title] = files;
                }
            }
            displayBooks(filtered);
        }
    });
}

// Sıralama fonksiyonu
function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.column = column;
        currentSort.ascending = true;
    }
    
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displayBooks(allBooks);
    } else {
        const filtered = {};
        for (const [title, files] of Object.entries(allBooks)) {
            if (title.toLowerCase().includes(searchTerm)) {
                filtered[title] = files;
            }
        }
        displayBooks(filtered);
    }
}

// Sıralama uygula
function applySorting(booksArray) {
    const sorted = [...booksArray];
    
    sorted.sort((a, b) => {
        let comparison = 0;
        
        if (currentSort.column === 'no') {
            comparison = a.no - b.no;
        } else if (currentSort.column === 'title') {
            comparison = a.title.localeCompare(b.title);
        }
        
        return currentSort.ascending ? comparison : -comparison;
    });
    
    return sorted;
}

// Kapak resmini modal'da göster
function showCoverModal(title, fileId) {
    const modal = new bootstrap.Modal(document.getElementById('coverModal'));
    const modalTitle = document.getElementById('coverModalTitle');
    const modalImage = document.getElementById('coverModalImage');
    
    modalTitle.textContent = title;
    modalImage.src = DRIVE_THUMBNAIL_URL + fileId + '&sz=w800';
    modalImage.alt = title;
    
    modal.show();
}