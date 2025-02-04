const apiKey = 'b404d8bc1c229e9cb771c179755ad733';
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${apiKey}`
    }
};

// Funktion zum Schließen der Detailansicht
function closeDetailCard() {
    const overlay = document.querySelector('.detail-overlay');
    if (overlay) {
        overlay.remove();
    }
}
 
let selectedGenre = '';
let currentPage = 1; // Aktuelle Seite für die Pagination
const itemsPerPage = 10; // Anzahl der Elemente pro Seite
let allResults = []; // Alle bisher geladenen Ergebnisse
let favorites = []; // Favoriten-Array
 
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
                <button class="favorite-button">
                    <i class="fas fa-heart"></i>
                </button>
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
    const auth = getAuth();
    const isLoggedIn = auth.currentUser !== null;

    // Erstelle den Favoriten-Button
    const favoriteButton = detailCardOverlay.querySelector('.favorite-button');
    favoriteButton.style.display = isLoggedIn ? 'block' : 'none';

    if (isLoggedIn) {
        const db = getFirestore();
        const favoriteRef = doc(db, 'favorites', auth.currentUser.uid, 'titles', item.id.toString());
        const docSnap = await getDoc(favoriteRef);
        
        if (docSnap.exists()) {
            favoriteButton.classList.add('active');
        }

        favoriteButton.addEventListener('click', async () => {
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
    }
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
    const favoritesSection = document.getElementById('favorites');
    
    if (!auth.currentUser) {
        favoritesSection.innerHTML = '<p class="no-favorites">Bitte melde dich an, um deine Favoriten zu sehen.</p>';
        return;
    }

    try {
        const db = getFirestore();
        const favoritesRef = collection(db, 'favorites', auth.currentUser.uid, 'titles');
        const querySnapshot = await getDocs(favoritesRef);
        
        if (querySnapshot.empty) {
            favoritesSection.innerHTML = '<p class="no-favorites">Keine Favoriten vorhanden</p>';
            return;
        }

        const gridContainer = document.createElement('div');
        gridContainer.className = 'preview-grid';
        
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const previewCard = document.createElement('div');
            previewCard.className = 'preview-card';
            previewCard.innerHTML = `
                <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : './images/no-poster.jpg'}" 
                     alt="${item.title || 'Kein Titel verfügbar'}">
                <h3>${item.title || 'Kein Titel verfügbar'}</h3>
                <p class="rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</p>
            `;
            
            previewCard.addEventListener('click', () => {
                showDetailCard(item, favoritesSection);
            });
            
            gridContainer.appendChild(previewCard);
        });

        favoritesSection.innerHTML = '<h2>Meine Favoriten</h2>';
        favoritesSection.appendChild(gridContainer);
    } catch (error) {
        console.error('Fehler beim Laden der Favoriten:', error);
        favoritesSection.innerHTML = '<p class="error">Fehler beim Laden der Favoriten</p>';
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

// Event Listener für den Top 100 Serien Button
document.getElementById('top100SeriesButton').addEventListener('click', async function() {
    try {
        const movieResults = document.getElementById('movieResults');
        const topMovies = document.getElementById('topMovies');
        const favorites = document.getElementById('favorites');
        const loadMoreButton = document.getElementById('loadMoreButton');

        // Verstecke andere Sektionen
        topMovies.style.display = 'none';
        favorites.style.display = 'none';
        loadMoreButton.style.display = 'none';
        movieResults.style.display = 'block';

        movieResults.innerHTML = '<div class="loading">Lade Top 100 Serien...</div>';
        
        // Sammle die ersten 5 Seiten (da jede Seite 20 Ergebnisse enthält)
        const pages = await Promise.all([1, 2, 3, 4, 5].map(page => 
            fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${apiKey}&language=de&page=${page}`, options)
            .then(response => response.json())
        ));

        // Kombiniere alle Ergebnisse
        allResults = pages.flatMap(page => page.results.map(show => ({
            ...show,
            mediaType: 'tv',
            title: show.name,
            release_date: show.first_air_date,
            overview: show.overview || 'Keine Beschreibung verfügbar'
        })));

        // Sortiere nach Bewertung
        allResults.sort((a, b) => b.vote_average - a.vote_average);

        // Nimm nur die Top 100
        allResults = allResults.slice(0, 100);

        // Erstelle Header-Bereich
        movieResults.innerHTML = `
            <div class="top100-header">
                <h2>Die 100 bestbewerteten Serien</h2>
                <p class="top100-info">Basierend auf Bewertungen von TMDb-Nutzern</p>
            </div>
        `;
        
        // Erstelle Grid-Container für die Vorschaukarten
        const gridContainer = document.createElement('div');
        gridContainer.className = 'preview-grid';
        movieResults.appendChild(gridContainer);

        allResults.forEach((item, index) => {
            const previewCard = document.createElement('div');
            previewCard.className = 'preview-card';
            
            // Berechne die durchschnittliche Anzahl der Stimmen
            const voteCount = item.vote_count ? item.vote_count.toLocaleString() : '0';
            
            previewCard.innerHTML = `
                <div class="rank-badge">#${index + 1}</div>
                <img src="${item.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
                    : './images/no-poster.jpg'}" 
                    alt="${item.title || 'Kein Titel verfügbar'}"
                >
                <div class="card-content">
                    <h3>${item.title || 'Kein Titel verfügbar'}</h3>
                    <div class="rating-info">
                        <p class="rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</p>
                        <p class="vote-count">${voteCount} Bewertungen</p>
                    </div>
                    <p class="release-year">${item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}</p>
                </div>
            `;

            previewCard.addEventListener('click', () => {
                // Verwende die gleiche showDetailCard Funktion wie für normale Suchen
                showDetailCard({
                    ...item,
                    mediaType: 'tv',
                    title: item.title,
                    release_date: item.release_date,
                    overview: item.overview
                }, movieResults);
            });

            gridContainer.appendChild(previewCard);
        });

    } catch (error) {
        console.error('Fehler beim Laden der Top 100 Serien:', error);
        movieResults.innerHTML = '<p class="error-message">Ein Fehler ist beim Laden der Top 100 Serien aufgetreten</p>';
    }
});
    