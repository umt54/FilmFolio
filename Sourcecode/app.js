import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// API Key
const apiKey = 'b404d8bc1c229e9cb771c179755ad733';

// API Key und Base URL
const baseUrl = 'https://api.themoviedb.org/3';

// Hilfsfunktion für API-Aufrufe
async function fetchFromTMDB(endpoint) {
    const response = await fetch(`${baseUrl}${endpoint}&api_key=${apiKey}`);
    if (!response.ok) {
        throw new Error('Netzwerk-Antwort war nicht ok');
    }
    return response.json();
}

// Filme suchen
async function searchMovies(query) {
    try {
        const data = await fetchFromTMDB(`/search/multi?language=de-DE&query=${encodeURIComponent(query)}&page=1`);
        console.log('Suchergebnisse:', data);
        displayResults(data.results);
    } catch (error) {
        console.error('Fehler bei der Suche:', error);
        document.getElementById('movieResults').innerHTML = `
            <div class="container">
                <p>Fehler beim Laden der Suchergebnisse: ${error.message}</p>
            </div>
        `;
    }
}

// Top-Filme laden
async function loadTopMovies() {
    try {
        const data = await fetchFromTMDB(`/movie/top_rated?language=de-DE&page=${currentPage}`);
        console.log('Top Filme:', data);
        displayTopContent(data.results, 'movie');
    } catch (error) {
        console.error('Fehler beim Laden der Top-Filme:', error);
        document.getElementById('movieResults').innerHTML = `
            <div class="container">
                <p>Fehler beim Laden der Top-Filme: ${error.message}</p>
            </div>
        `;
    }
}

// Top-Serien laden
async function loadTopSeries() {
    try {
        const data = await fetchFromTMDB(`/tv/top_rated?language=de-DE&page=${currentPage}`);
        console.log('Top Serien:', data);
        displayTopContent(data.results, 'tv');
    } catch (error) {
        console.error('Fehler beim Laden der Top-Serien:', error);
        document.getElementById('movieResults').innerHTML = `
            <div class="container">
                <p>Fehler beim Laden der Top-Serien: ${error.message}</p>
            </div>
        `;
    }
}

// Suchergebnisse anzeigen
function displayResults(results) {
    const container = document.getElementById('movieResults');
    container.style.display = 'block';
    
    if (!results || results.length === 0) {
        container.innerHTML = `<div class="container"><p>Keine Ergebnisse gefunden.</p></div>`;
        return;
    }

    let html = '<div class="preview-grid">';
    results.forEach(item => {
        if (item.media_type === 'person') return;
        
        // Daten aufbereiten
        const title = item.title || item.name;
        const mediaType = item.media_type;
        const itemData = {
            id: item.id,
            title: title,
            poster_path: item.poster_path,
            overview: item.overview,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date,
            mediaType: mediaType
        };

        html += `
            <div class="preview-card" data-item='${JSON.stringify(itemData).replace(/'/g, "&apos;").replace(/"/g, "&quot;")}'>
                <img src="${item.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
                    : './images/no-poster.jpg'}" 
                    alt="${title}">
                <div class="card-content">
                    <h3>${title}</h3>
                    <div class="rating-info">
                        <span class="rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</span>
                        <span>${item.release_date ? new Date(item.release_date).getFullYear() : ''}</span>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;

    // Event-Listener für die Preview-Cards hinzufügen
    const previewCards = container.querySelectorAll('.preview-card');
    previewCards.forEach(card => {
        card.addEventListener('click', function() {
            const itemData = JSON.parse(this.getAttribute('data-item'));
            showDetailCard(itemData);
        });
    });
}

// Top-Filme anzeigen
function displayTopMovies(movies) {
    const container = document.getElementById('topMovies');
    
    let html = `
        <div class="top100-header">
            <h2>Top Filme</h2>
            <p class="top100-info">Die am besten bewerteten Filme aller Zeiten</p>
        </div>
        <div class="preview-grid">
    `;
    
    movies.forEach(movie => {
        html += `
            <div class="preview-card" onclick='showDetailCard(${JSON.stringify({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                overview: movie.overview,
                vote_average: movie.vote_average,
                release_date: movie.release_date,
                mediaType: 'movie'
            }).replace(/'/g, "&apos;")})'> 
                <img src="${movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                    : './images/no-poster.jpg'}" 
                    alt="${movie.title}">
                <div class="card-content">
                    <h3>${movie.title}</h3>
                    <div class="rating-info">
                        <span class="rating">⭐ ${movie.vote_average.toFixed(1)}/10</span>
                        <span>${new Date(movie.release_date).getFullYear()}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Warte auf DOM-Ladung bevor Event Listener hinzugefügt werden
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query) {
                searchMovies(query);
            } else {
                document.getElementById('movieResults').innerHTML = '';
            }
        });
    }

    // Event Listener für Top 100 Filme Button
    const top100MoviesButton = document.getElementById('top100MoviesButton');
    if (top100MoviesButton) {
        top100MoviesButton.addEventListener('click', () => {
            currentPage = 1;
            currentType = 'movie';
            loadTopMovies();
        });
    }

    // Event Listener für Top 100 Serien Button
    const top100SeriesButton = document.getElementById('top100SeriesButton');
    if (top100SeriesButton) {
        top100SeriesButton.addEventListener('click', () => {
            currentPage = 1;
            currentType = 'tv';
            loadTopSeries();
        });
    }

    // Event Listener für den Zufälligen Film Button
    const randomMovieButton = document.getElementById('randomMovieButton');
    if (randomMovieButton) {
        randomMovieButton.addEventListener('click', showRandomMovie);
    }

    // Event Listener für den Mehr Laden Button
    const loadMoreButton = document.getElementById('loadMoreButton');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', async () => {
            if (currentType === 'movie') {
                currentPage++;
                await loadTopMovies();
            } else if (currentType === 'tv') {
                currentPage++;
                await loadTopSeries();
            }
        });
    }

    // Lade Top-Filme beim Start
    loadTopMovies();
});

// Funktion im globalen Kontext verfügbar machen
window.showDetailCard = showDetailCard;

// Export der Funktionen
export { loadFavorites, showDetailCard };
 
let selectedGenre = '';
let currentPage = 1;
let currentType = '';
let allResults = []; // Alle bisher geladenen Ergebnisse
let favorites = []; // Favoriten-Array
let isLoading = false;
 
// Event Listener für die Suchfunktion
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
            fetch(`https://api.themoviedb.org/3/search/movie?api_key=${b404d8bc1c229e9cb771c179755ad733}&language=de&query=${encodeURIComponent(searchTerm)}`),
            fetch(`https://api.themoviedb.org/3/search/tv?api_key=${b404d8bc1c229e9cb771c179755ad733}&language=de&query=${encodeURIComponent(searchTerm)}`)
        ]);
 
        const [movieData, tvData] = await Promise.all([movieResponse.json(), tvResponse.json()]);
 
        const movies = movieData.results.map(movie => ({
            ...movie,
            mediaType: 'movie',
            title: movie.title,
            release_date: movie.release_date,
            score: calculateScore(movie.vote_average, movie.popularity, movie.vote_count)
        }));
 
        const tvShows = tvData.results.map(show => ({
            ...show,
            mediaType: 'tv',
            title: show.name,
            release_date: show.first_air_date,
            score: calculateScore(show.vote_average, show.popularity, show.vote_count)
        }));
 
        allResults = [...movies, ...tvShows];

        // Sortiere die Ergebnisse nach dem berechneten Score
        allResults.sort((a, b) => b.score - a.score);

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
                <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : './images/no-poster.jpg'}" alt="${item.title || 'Kein Titel verfügbar'}">
                <div class="card-content">
<h3>${item.title || 'Kein Titel verfügbar'}</h3>
                    <div class="rating-info">
<p class="rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</p>
                        <p class="popularity">${Math.round(item.popularity)} Views</p>
                    </div>
                    <p class="vote-count">${item.vote_count ? item.vote_count.toLocaleString() : '0'} Bewertungen</p>
                </div>
            `;
 
            previewCard.addEventListener('click', () => {
                showDetailCard(item);
            });
 
            gridContainer.appendChild(previewCard);
        });
    } catch (error) {
        console.error('Fehler bei der Suche:', error);
        movieResults.innerHTML = '<p>Ein Fehler ist aufgetreten</p>';
    }
}

// Funktion zur Berechnung des Gesamtscores
function calculateScore(voteAverage, popularity, voteCount) {
    // Normalisiere die Werte
    const normalizedRating = voteAverage / 10; // Rating ist von 0-10
    const normalizedPopularity = Math.min(popularity / 1000, 1); // Popularität auf 0-1 begrenzen
    const normalizedVoteCount = Math.min(voteCount / 10000, 1); // Stimmenanzahl auf 0-1 begrenzen

    // Gewichtung der einzelnen Faktoren
    const ratingWeight = 0.5;    // 50% Gewichtung für die Bewertung
    const popularityWeight = 0.3; // 30% Gewichtung für die Popularität
    const voteCountWeight = 0.2;  // 20% Gewichtung für die Anzahl der Stimmen

    // Berechne den gewichteten Durchschnitt
    return (normalizedRating * ratingWeight) + 
           (normalizedPopularity * popularityWeight) + 
           (normalizedVoteCount * voteCountWeight);
}
 
// Funktion zum Abrufen der Seriendetails
async function getSeriesDetails(seriesId) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/tv/${seriesId}?api_key=${b404d8bc1c229e9cb771c179755ad733}&language=de`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fehler beim Laden der Seriendetails:', error);
        return null;
    }
}
 
// Funktion zum Anzeigen von Top-Inhalten (Filme/Serien)
function displayTopContent(results, type) {
    const container = document.getElementById('movieResults');
    container.style.display = 'block';
    
    let title = type === 'movie' ? 'Top Filme' : 'Top Serien';
    let description = type === 'movie' 
        ? 'Die am besten bewerteten Filme aller Zeiten' 
        : 'Die besten Serien nach Bewertungen';

    let html = `
        <div class="top100-header">
            <h2>${title}</h2>
            <p class="top100-info">${description}</p>
        </div>
        <div class="preview-grid">
    `;

    results.forEach((item, index) => {
        const position = (currentPage - 1) * 20 + index + 1;
        const itemData = {
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            overview: item.overview,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date,
            mediaType: type
        };

        html += `
            <div class="preview-card" onclick='window.showDetailCard(${JSON.stringify(itemData).replace(/'/g, "&apos;").replace(/"/g, "&quot;")})'>
                <div class="rank-badge">#${position}</div>
                <img src="${item.poster_path 
                    ? 'https://image.tmdb.org/t/p/w500' + item.poster_path 
                    : './images/no-poster.jpg'}" 
                    alt="${item.title || item.name}">
                <div class="card-content">
                    <h3>${item.title || item.name}</h3>
                    <div class="rating-info">
                        <span class="rating">⭐ ${item.vote_average.toFixed(1)}/10</span>
                        <span>${new Date(item.release_date || item.first_air_date).getFullYear()}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
    
    // Zeige den "Mehr laden"-Button
    document.getElementById('loadMoreButton').style.display = 'block';
}

async function showDetailCard(item) {
    let streamingInfo = '';
    
    try {
        const streamingResponse = await fetch(`https://api.themoviedb.org/3/${item.mediaType || 'movie'}/${item.id}/watch/providers?api_key=${apiKey}`);
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
                                <img src="https://image.tmdb.org/t/p/original${mainProvider.logo_path}" alt="${providerDisplayNames}">
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

    const detailCardOverlay = document.createElement('div');
    detailCardOverlay.className = 'detail-overlay';
    detailCardOverlay.innerHTML = `
        <div class="movie-card">
            <div class="movie-poster">
                <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : './images/no-poster.jpg'}" alt="${item.title || 'Kein Titel verfügbar'}">
            </div>
            <div class="info-container">
                <h3>${item.title || 'Kein Titel verfügbar'}</h3>
                <p>${item.overview || 'Keine Beschreibung verfügbar'}</p>
                <div class="info-grid">
                    <p>⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</p>
                    <p>📅 ${releaseYear}</p>
                    <p>🎬 ${item.mediaType === 'movie' ? 'Film' : 'Serie'}</p>
                </div>
                ${streamingInfo}
            </div>
            <div class="action-buttons">
                <button class="close-button">Zurück</button>
            </div>
        </div>
    `;

    document.body.appendChild(detailCardOverlay);

    detailCardOverlay.querySelector('.close-button').addEventListener('click', () => {
        detailCardOverlay.remove();
    });
}

    // Genre Filter
    document.getElementById('genreFilter').addEventListener('change', (e) => {
        selectedGenre = e.target.value;
    });

    // Lade Genres
    async function loadGenres() {
        try {
            const [movieGenres, tvGenres] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${b404d8bc1c229e9cb771c179755ad733}&language=de`),
            fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${b404d8bc1c229e9cb771c179755ad733}&language=de`)
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

// Zufälliger Titel Button
document.getElementById('randomMovie').addEventListener('click', async () => {
    const movieResults = document.getElementById('movieResults');
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=de&page=1`);
        const data = await response.json();
        const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
        
        // Container leeren und Grid erstellen
        movieResults.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'preview-grid';
        
        // Film-Card erstellen
        const card = document.createElement('div');
        card.className = 'preview-card';
        card.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w500${randomMovie.poster_path}" alt="${randomMovie.title}">
            <div class="card-content">
                <h3>${randomMovie.title}</h3>
                <p class="rating">⭐ ${randomMovie.vote_average.toFixed(1)}/10</p>
                <p class="release-year">${new Date(randomMovie.release_date).getFullYear()}</p>
            </div>
        `;
        
        grid.appendChild(card);
        movieResults.appendChild(grid);
        
        // Event Listener für Klick auf Card
        card.addEventListener('click', () => {
            const detailCardOverlay = document.createElement('div');
            detailCardOverlay.className = 'detail-overlay';
            detailCardOverlay.innerHTML = `
                <div class="movie-card">
                    <img src="https://image.tmdb.org/t/p/w500${randomMovie.poster_path}" alt="${randomMovie.title}">
                    <div class="movie-info">
                        <h3>${randomMovie.title}</h3>
                        <p>${randomMovie.overview}</p>
                        <p>Bewertung: ${randomMovie.vote_average.toFixed(1)}/10</p>
                        <p>Erscheinungsjahr: ${new Date(randomMovie.release_date).getFullYear()}</p>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()">Schließen</button>
                    </div>
                </div>
            `;
            document.body.appendChild(detailCardOverlay);
        });
    } catch (error) {
        console.error('Fehler:', error);
        movieResults.innerHTML = '<p>Fehler beim Laden des Films</p>';
    }
});

// Top 100 Filme Button
// Top 100 Filme Button
document.getElementById('top100MoviesButton').addEventListener('click', () => {
    currentPage = 1;
    currentType = 'movie';
    loadTopMovies();
});

// Top 100 Serien Button
document.getElementById('top100SeriesButton').addEventListener('click', () => {
    currentPage = 1;
    currentType = 'tv';
    loadTopSeries();
});
// Mehr anzeigen Button
document.getElementById('loadMoreButton').addEventListener('click', async () => {
    const movieResults = document.getElementById('movieResults');
    const grid = movieResults.querySelector('.preview-grid');
    
    if (!grid || !currentType) {
        console.error('Grid oder currentType nicht gefunden');
            return;
    }
    
    try {
        currentPage++;
        
        // API-Aufruf
        const response = await fetch(`https://api.themoviedb.org/3/${currentType}/top_rated?api_key=${apiKey}&language=de&page=${currentPage}`);
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }
        const data = await response.json();
        
        // Neue Karten hinzufügen
        data.results.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'preview-card';
            
            // Titel und Datum basierend auf Typ
            const title = currentType === 'movie' ? item.title : item.name;
            const date = currentType === 'movie' ? item.release_date : item.first_air_date;
            
            // Card HTML
            card.innerHTML = `
                <div class="rank-badge">#${((currentPage - 1) * 20) + index + 1}</div>
                <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${title}">
                <div class="card-content">
                    <h3>${title}</h3>
                    <p class="rating">⭐ ${item.vote_average.toFixed(1)}/10</p>
                    <p class="release-year">${date ? new Date(date).getFullYear() : 'N/A'}</p>
                </div>
            `;
            
            // Karte zum Grid hinzufügen
            grid.appendChild(card);
        });
        
        // Button nach 5 Seiten ausblenden
        if (currentPage >= 5) {
            document.getElementById('loadMoreButton').style.display = 'none';
        }
    } catch (error) {
        console.error('Fehler beim Laden weiterer Titel:', error);
        movieResults.innerHTML = `<p>Fehler beim Laden weiterer Titel: ${error.message}</p>`;
    }
});

// Dropdown Toggle Funktion
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown');
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    } else {
        dropdown.classList.add('show');
    }
}

// Event Listener für Klicks außerhalb des Dropdowns
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('dropdown');
    const hamburger = document.getElementById('hamburger');
    
    if (!hamburger.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// Dropdown beim Laden der Seite schließen
window.addEventListener('load', function() {
    const dropdown = document.getElementById('dropdown');
    dropdown.classList.remove('show');
});

// Favoriten laden
async function loadFavorites() {
    try {
        const favoritesRef = collection(db, 'favorites', auth.currentUser.uid, 'titles');
        const querySnapshot = await getDocs(favoritesRef);
        
        const favoritesSection = document.getElementById('favorites');
        
        if (querySnapshot.empty) {
            favoritesSection.innerHTML = `
                <div class="container">
                    <h2>Meine Favoriten</h2>
                    <p>Du hast noch keine Favoriten gespeichert.</p>
                </div>
            `;
                return;
            }

        let favoritesHTML = `
            <div class="container">
                <h2>Meine Favoriten</h2>
                <div class="preview-grid">
        `;

        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
            
            favoritesHTML += `
                <div class="preview-card" onclick='showDetailCard(${itemJson})'>
                    <img src="${item.poster_path 
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
                        : './images/no-poster.jpg'}" 
                        alt="${item.title}">
                    <div class="card-content">
                        <h3>${item.title}</h3>
                        <div class="rating-info">
                            <span class="rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</span>
                            <span>${item.release_date ? new Date(item.release_date).getFullYear() : ''}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        favoritesHTML += `
                </div>
            </div>
        `;

        favoritesSection.innerHTML = favoritesHTML;
        console.log('Favoriten wurden geladen und angezeigt');

        } catch (error) {
        console.error('Fehler beim Laden der Favoriten:', error);
        const favoritesSection = document.getElementById('favorites');
        favoritesSection.innerHTML = `
            <div class="container">
                <h2>Meine Favoriten</h2>
                <p>Fehler beim Laden der Favoriten: ${error.message}</p>
            </div>
        `;
    }
}

// Event Listener für den Favoriten-Link
document.getElementById('favoritesLink').addEventListener('click', async (e) => {
    e.preventDefault();
    console.log('Favoriten-Link wurde geklickt');
    
    if (e.target.classList.contains('disabled')) {
        console.log('Favoriten-Link ist deaktiviert');
        return;
    }
    
    const movieResults = document.getElementById('movieResults');
    const topMovies = document.getElementById('topMovies');
    const favorites = document.getElementById('favorites');
    
    if (movieResults) movieResults.style.display = 'none';
    if (topMovies) topMovies.style.display = 'none';
    if (favorites) {
        favorites.style.display = 'block';
        await loadFavorites();
    } else {
        console.error('Favorites container nicht gefunden');
    }
});

// Füge diese Zeile zum Auth State Listener hinzu
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadFavorites(); // Lade Favoriten direkt nach dem Login
    }
});

window.closeDetailCard = closeDetailCard;

async function showRandomMovie() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=de&page=1`);
        const data = await response.json();
        const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
        
        // Öffne die Detailansicht für den zufälligen Film
        showDetailCard(randomMovie);
    } catch (error) {
        console.error('Fehler beim Laden des zufälligen Films:', error);
    }
}

document.getElementById('randomMovieButton').addEventListener('click', showRandomMovie);

    