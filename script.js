// Google Drive URL formatları
const DRIVE_DOWNLOAD_URL = 'https://drive.google.com/uc?export=download&id=';

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
        
        if (book.Type === 'cover') {
            // Cover için CoverFile kullan
            grouped[book.Title][book.Type] = book.CoverFile;
        } else {
            // PDF ve Audio için FileId kullan
            grouped[book.Title][book.Type] = book.FileId;
        }
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
    
    // Eski Schema etiketlerini temizle (Sayfa Yenilenmediği durumlarda)
    document.querySelectorAll('.book-schema').forEach(el => el.remove());
    
    // Tabloyu oluştur
    booksArray.forEach((book, index) => {
        // --- SCHEMA MARKUP EKLEME BAŞLANGIÇ ---
        const schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.className = 'book-schema'; // Temizlik için sınıf ekledik
        schemaScript.textContent = createBookSchema(book.title);
        
        // Schema etiketini body'ye ekle
        document.body.appendChild(schemaScript);
        // --- SCHEMA MARKUP EKLEME BİTİŞ ---
        
        const row = document.createElement('tr');
        
        // No
        const noCell = document.createElement('td');
        // NOT: Tablo No'su, sıralamadan sonraki index + 1 olmalıdır.
        // Eğer sıralama yapılırsa, bu No numarası statik olmayabilir.
        noCell.textContent = index + 1; 
        row.appendChild(noCell);
        
        // Headline
        const titleCell = document.createElement('td');
        const titleStrong = document.createElement('strong');
        titleStrong.textContent = book.title;
        titleCell.appendChild(titleStrong);
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
function showCoverModal(title, coverFile) {
    const modal = new bootstrap.Modal(document.getElementById('coverModal'));
    const modalTitle = document.getElementById('coverModalTitle');
    const modalImage = document.getElementById('coverModalImage');
    
    modalTitle.textContent = title;
    modalImage.src = 'covers/' + coverFile;
    // ALT etiketi eklendi: SEO ve Erişilebilirlik için önemlidir.
    modalImage.alt = 'Cover image for the book: ' + title;
    
    modal.show();
}

// --- YENİ SCHEMA MARKUP FONKSİYONU ---
/**
 * Kitap başlığını kullanarak Book Schema (JSON-LD) oluşturur.
 * @param {string} title - Kitabın başlığı.
 * @returns {string} Oluşturulan JSON-LD dizesi.
 */
function createBookSchema(title) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": title,
        "description": `Free download of the Islamic book: ${title} in PDF and MP3 format.`,
        "url": window.location.href, // Kitabın bulunduğu sayfa
        "inLanguage": "en", // Kitaplarımızın İngilizce olduğunu biliyoruz (books.json'a göre)
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "url": window.location.href
        },
        "potentialAction": {
            "@type": "DownloadAction",
            "target": window.location.href,
            "encodingFormat": ["application/pdf", "audio/mpeg"]
        }
    };
    return JSON.stringify(schema, null, 2);
}
