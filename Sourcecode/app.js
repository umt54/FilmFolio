const apiKey = 'b404d8bc1c229e9cb771c179755ad733';
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${apiKey}`
    }
};
 
let selectedGenre = '';
let currentPage = 1; // Aktuelle Seite für die Pagination
const itemsPerPage = 10; // Anzahl der Elemente pro Seite
let allResults = []; // Alle bisher geladenen Ergebnisse
let favorites = []; // Favoriten-Array
 
// Suchfunktion
document.getElementById('searchButton').addEventListener('click', performSearch);
document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});
 
async function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (!searchTerm) return;
 
    try {
        const movieResults = document.getElementById('movieResults');
        movieResults.innerHTML = '<div class="loading">Suche läuft...</div>';
 
        const [movieResponse, tvResponse] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=de&query=${encodeURIComponent(searchTerm)}`, options),
            fetch(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=de&query=${encodeURIComponent(searchTerm)}`, options)
        ]);
 
        const [movieData, tvData] = await Promise.all([movieResponse.json(), tvResponse.json()]);
 
        const movies = movieData.results.map(movie => ({
            ...movie,
            mediaType: 'movie',
            title: movie.title,
            release_date: movie.release_date
        }));
 
        const tvShows = tvData.results.map(show => ({
            ...show,
            mediaType: 'tv',
            title: show.name,
            release_date: show.first_air_date
        }));
 
        allResults = [...movies, ...tvShows];
        movieResults.innerHTML = '';
 
        if (allResults.length === 0) {
            movieResults.innerHTML = '<p>Keine Ergebnisse gefunden</p>';
            return;
        }
 
        // Erstelle Grid-Container für die Vorschaukarten
        const gridContainer = document.createElement('div');
        gridContainer.className = 'preview-grid';
        movieResults.appendChild(gridContainer);
 
        allResults.forEach(item => {
            const previewCard = document.createElement('div');
            previewCard.className = 'preview-card';
            previewCard.innerHTML = `
<img src="${item.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    : './images/no-poster.jpg'}" alt="${item.title || 'Kein Titel verfügbar'}">
<h3>${item.title || 'Kein Titel verfügbar'}</h3>
<p class="rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</p>
            `;
 
            previewCard.addEventListener('click', () => {
                showDetailCard(item, movieResults);
            });
 
            gridContainer.appendChild(previewCard);
        });
    } catch (error) {
        console.error('Fehler bei der Suche:', error);
        movieResults.innerHTML = '<p>Ein Fehler ist aufgetreten</p>';
    }
}
 
// Funktion zum Abrufen der Seriendetails
async function getSeriesDetails(seriesId) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/tv/${seriesId}?api_key=${apiKey}&language=de`, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fehler beim Laden der Seriendetails:', error);
        return null;
    }
}
 
// Detailkartenanzeige
async function showDetailCard(item, container) {
    let seasonInfo = '';
    let streamingInfo = '';
    
    try {
        const streamingResponse = await fetch(`https://api.themoviedb.org/3/${item.mediaType || 'movie'}/${item.id}/watch/providers?api_key=${apiKey}`, options);
        const streamingData = await streamingResponse.json();
        
        if (streamingData.results && streamingData.results.DE) {
            const providers = streamingData.results.DE;
            if (providers.flatrate && providers.flatrate.length > 0) {
                const mainProvider = providers.flatrate[0];
                const providerUrl = {
                    'Netflix': 'https://www.netflix.com',
                    'Amazon Prime Video': 'https://www.amazon.de/prime-video',
                    'Disney Plus': 'https://www.disneyplus.com',
                    'Sky': 'https://www.wow.de',
                    'RTL Plus': 'https://www.rtlplus.de',
                    'Paramount Plus': 'https://www.paramountplus.com/de',
                    'Apple TV Plus': 'https://tv.apple.com',
                    'MUBI': 'https://mubi.com/de',
                    'WOW': 'https://www.wow.de',
                    'MagentaTV': 'https://www.telekom.de/magenta-tv',
                    'Joyn Plus': 'https://www.joyn.de',
                    'ARD': 'https://www.ardmediathek.de',
                    'ZDF': 'https://www.zdf.de'
                }[mainProvider.provider_name] || '#';

                // Anpassen der Provider-Namen für die Anzeige
                const providerDisplayNames = {
                    'Netflix': 'Netflix',
                    'Amazon Prime Video': 'Amazon Prime Video',
                    'Disney+': 'Disney Plus',
                    'Sky': 'Sky',
                    'RTL+': 'RTL Plus',
                    'Paramount+': 'Paramount Plus',
                    'Apple TV+': 'Apple TV Plus',
                    'MUBI': 'MUBI',
                    'WOW': 'WOW',
                    'MagentaTV': 'MagentaTV',
                    'Joyn+': 'Joyn Plus',
                    'ARD': 'ARD Mediathek',
                    'ZDF': 'ZDF Mediathek'
                }[mainProvider.provider_name] || mainProvider.provider_name;

                streamingInfo = `
                    <div class="streaming-info">
                        <h4>🎬 Verfügbar bei:</h4>
                        <a href="${providerUrl}" target="_blank" class="provider-link">
                            <div class="provider">
                                <img src="https://image.tmdb.org/t/p/original${mainProvider.logo_path}" 
                                     alt="${providerDisplayNames}">
                                <p class="provider-name">${providerDisplayNames}</p>
                            </div>
                        </a>
                    </div>`;
            } else {
                streamingInfo = `
                    <div class="streaming-info">
                        <p class="no-streaming">💔 Nicht zum Streaming verfügbar</p>
                    </div>`;
            }
        }
    } catch (error) {
        console.error('Fehler beim Laden der Streaming-Informationen:', error);
        streamingInfo = `
            <div class="streaming-info">
                <p class="error-streaming">⚠️ Streaming-Info nicht verfügbar</p>
            </div>`;
    }

    const releaseYear = item.release_date ? item.release_date.split('-')[0] : 'Kein Datum verfügbar';

    // Erstelle das Overlay
    const detailCardOverlay = document.createElement('div');
    detailCardOverlay.className = 'detail-overlay';
    detailCardOverlay.innerHTML = `
        <div class="movie-card">
            <div class="movie-poster">
                <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : './images/no-poster.jpg'}" 
                     alt="${item.title || 'Kein Titel verfügbar'}">
                <div class="info-container">
                    <div class="left-column">
                        ${streamingInfo}
                    </div>
                    <div class="right-column">
                        <div class="info-grid">
                            <p>⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</p>
                            <p>📅 ${releaseYear}</p>
                            <p>🎬 ${item.mediaType === 'movie' ? 'Film' : 'Serie'}</p>
                        </div>
                        <button class="close-button">Zurück</button>
                    </div>
                </div>
            </div>
            <div class="movie-info">
                <h3>${item.title || 'Kein Titel verfügbar'}</h3>
                <p>${item.overview || 'Keine Beschreibung verfügbar'}</p>
            </div>
        </div>
    `;

    // Füge das Overlay zum Body hinzu
    document.body.appendChild(detailCardOverlay);

    // Event Listener für den Schließen-Button
    detailCardOverlay.querySelector('.close-button').addEventListener('click', () => {
        detailCardOverlay.remove();
    });

    // Füge den Favoriten-Button hinzu
    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'favorite-button';
    favoriteButton.innerHTML = '<i class="fas fa-heart"></i>';

    // Prüfe ob bereits favorisiert
    const auth = getAuth();
    if (auth.currentUser) {
        const db = getFirestore();
        const favoriteRef = doc(db, 'favorites', auth.currentUser.uid, 'titles', item.id.toString());
        const docSnap = await getDoc(favoriteRef);
        if (docSnap.exists()) {
            favoriteButton.classList.add('active');
        }
    }

    // Event Listener für den Favoriten-Button
    favoriteButton.addEventListener('click', async () => {
        const auth = getAuth();
        if (!auth.currentUser) {
            alert('Bitte melde dich an, um Favoriten zu speichern');
            return;
        }

        const db = getFirestore();
        const favoriteRef = doc(db, 'favorites', auth.currentUser.uid, 'titles', item.id.toString());
        const docSnap = await getDoc(favoriteRef);

        try {
            if (docSnap.exists()) {
                await deleteDoc(favoriteRef);
                favoriteButton.classList.remove('active');
            } else {
                await setDoc(favoriteRef, {
                    id: item.id,
                    title: item.title,
                    poster_path: item.poster_path,
                    overview: item.overview,
                    vote_average: item.vote_average,
                    release_date: item.release_date,
                    media_type: item.mediaType || 'movie',
                    added_at: new Date().toISOString()
                });
                favoriteButton.classList.add('active');
            }
        } catch (error) {
            console.error('Fehler beim Verarbeiten des Favoriten:', error);
            alert('Ein Fehler ist aufgetreten');
        }
    });

    // Füge den Favoriten-Button zur movie-info hinzu
    detailCardOverlay.querySelector('.movie-info').appendChild(favoriteButton);
}
 
// Genre Filter
document.getElementById('genreFilter').addEventListener('change', (e) => {
    selectedGenre = e.target.value;
});

// Lade Genres
async function loadGenres() {
    try {
        const [movieGenres, tvGenres] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=de`, options),
            fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${apiKey}&language=de`, options)
        ]);

        const movieData = await movieGenres.json();
        const tvData = await tvGenres.json();

        const allGenres = [...new Map([...movieData.genres, ...tvData.genres]
            .map(item => [item.id, item])).values()];

        const genreSelect = document.getElementById('genreFilter');
        genreSelect.innerHTML = '<option value="">Genre auswählen</option>';
        allGenres.forEach(genre => {
            genreSelect.innerHTML += `<option value="${genre.id}">${genre.name}</option>`;
        });
    } catch (error) {
        console.error('Fehler beim Laden der Genres:', error);
    }
}

// Initialisierung
window.onload = loadGenres;

document.getElementById('randomMovie').textContent = 'Zufälliger Titel';

// Funktion für zufälligen Titel
function randomTitle() {
    if (allResults.length === 0) {
        console.error('Keine Ergebnisse für Zufallstitel verfügbar.');
        return;
    }
    const randomIndex = Math.floor(Math.random() * allResults.length);
    const randomItem = allResults[randomIndex];
    showDetailCard(randomItem, document.getElementById('movieResults'));
}

// Event Listener für den "Mehr anzeigen"-Button
document.getElementById('loadMoreButton').addEventListener('click', loadTopMovies);

// Funktion zum Laden der Top-Filme/Serien und Hinzufügen zur bestehenden Liste
async function loadTopMovies() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=de&page=${currentPage}`, options);
        const data = await response.json();

        const movieResults = document.getElementById('movieResults');

        // Wenn keine neuen Filme gefunden werden
        if (!data.results || data.results.length === 0) {
            movieResults.innerHTML += '<p>Keine weiteren Ergebnisse</p>';
            return;
        }

        // Füge die neuen Ergebnisse zu den bereits angezeigten Ergebnissen hinzu
        allResults = [...allResults, ...data.results];

        // Sortiere alle Ergebnisse nach Bewertung (absteigend)
        allResults.sort((a, b) => b.vote_average - a.vote_average);

        // Leere den Container und füge die sortierten Ergebnisse hinzu
        movieResults.innerHTML = '';

        // Erstelle Grid-Container für die Vorschaukarten
        const gridContainer = document.createElement('div');
        gridContainer.className = 'preview-grid';
        movieResults.appendChild(gridContainer);
        
        allResults.forEach(item => {
            // Erstelle Vorschaukarte
            const previewCard = document.createElement('div');
            previewCard.className = 'preview-card';
            previewCard.innerHTML = `
                <img src="${item.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
                    : './images/no-poster.jpg'}" 
                    alt="${item.title || 'Kein Titel verfügbar'}"
                >
                <h3>${item.title || 'Kein Titel verfügbar'}</h3>
                <p class="rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</p>
            `;

            // Click Event für die Vorschaukarte
            previewCard.addEventListener('click', () => {
                showDetailCard(item, movieResults);
            });

            gridContainer.appendChild(previewCard);
        });

        currentPage++; // Erhöhe die Seite für die nächste Anfrage
    } catch (error) {
        console.error('Fehler beim Laden der Top-Filme:', error);
    }
}

// Initialisiere das Laden der Top-Filme
loadTopMovies();

function toggleDropdown() {
    const dropdown = document.getElementById('dropdown');
    dropdown.classList.toggle('show'); // Toggle die Sichtbarkeit des Dropdowns
}

async function loadFavorites() {
    const auth = getAuth();
    const user = auth.currentUser;
    const favoritesSection = document.getElementById('favorites');
    
    if (!user) {
        favoritesSection.innerHTML = '<p class="no-favorites">Bitte melde dich an, um deine Favoriten zu sehen.</p>';
        return;
    }

    try {
        const db = getFirestore();
        const favoritesRef = collection(db, 'favorites', user.uid, 'titles');
        const q = query(favoritesRef);
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            favoritesSection.innerHTML = '<p class="no-favorites">Keine Favoriten vorhanden</p>';
            return;
        }

        favoritesSection.innerHTML = '<h2>Meine Favoriten</h2>';
        const gridContainer = document.createElement('div');
        gridContainer.className = 'preview-grid';
        
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const previewCard = document.createElement('div');
            previewCard.className = 'preview-card';
            previewCard.innerHTML = `
                <img src="${item.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
                    : './images/no-poster.jpg'}" 
                    alt="${item.title}">
                <h3>${item.title}</h3>
                <p class="rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</p>
            `;
            
            previewCard.addEventListener('click', () => {
                showDetailCard(item);
            });
            
            gridContainer.appendChild(previewCard);
        });
        
        favoritesSection.appendChild(gridContainer);
    } catch (error) {
        console.error('Fehler beim Laden der Favoriten:', error);
        favoritesSection.innerHTML = '<p class="error-message">Fehler beim Laden der Favoriten</p>';
    }
}

document.getElementById('favoritesLink').addEventListener('click', (e) => {
    e.preventDefault();
    if (e.target.classList.contains('disabled')) return;
    
    const movieResults = document.getElementById('movieResults');
    const topMovies = document.getElementById('topMovies');
    const favorites = document.getElementById('favorites');
    const loadMoreButton = document.getElementById('loadMoreButton');
    
    movieResults.style.display = 'none';
    topMovies.style.display = 'none';
    favorites.style.display = 'block';
    loadMoreButton.style.display = 'none';
    
    loadFavorites();
});

window.closeDetailCard = closeDetailCard;
    