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
        const streamingResponse = await fetch(`https://api.themoviedb.org/3/${item.mediaType}/${item.id}/watch/providers`, options);
        const streamingData = await streamingResponse.json();
        console.log('Streaming Data:', streamingData);

        if (streamingData.results && streamingData.results.DE) {
            const providers = streamingData.results.DE;
            if (providers.flatrate && providers.flatrate.length > 0) {
                streamingInfo = `
                    <div class="streaming-info">
                        <h4>✨ Verfügbar auf:</h4>
                        <div class="provider-list">
                            ${providers.flatrate.map(provider => `
                                <div class="provider" title="${provider.provider_name}">
                                    <img src="https://image.tmdb.org/t/p/original${provider.logo_path}" 
                                         alt="${provider.provider_name}">
                                    <span class="provider-name">${provider.provider_name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>`;
            } else {
                streamingInfo = `
                    <div class="streaming-info">
                        <p class="no-streaming">💔 Aktuell nicht zum Streamen verfügbar</p>
                    </div>`;
            }
        }
    } catch (error) {
        console.error('Fehler beim Laden der Streaming-Informationen:', error);
        streamingInfo = `
            <div class="streaming-info">
                <p class="error-streaming">⚠️ Streaming-Informationen konnten nicht geladen werden</p>
            </div>`;
    }

    if (item.mediaType === 'tv') {
        const seriesDetails = await getSeriesDetails(item.id);
        if (seriesDetails) {
            const totalEpisodes = seriesDetails.seasons.reduce((sum, season) => sum + (season.episode_count || 0), 0);
            seasonInfo = `
                <p>📺 Staffeln: ${seriesDetails.number_of_seasons}</p>
                <p>🎬 Folgen insgesamt: ${totalEpisodes}</p>
            `;
        }
    }

    const detailCardOverlay = document.createElement('div');
    detailCardOverlay.className = 'detail-overlay';
    detailCardOverlay.innerHTML = `
        <div class="movie-card">
            <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : './images/no-poster.jpg'}" 
                 alt="${item.title || 'Kein Titel verfügbar'}">
            <div class="movie-info">
                <h3>${item.title || 'Kein Titel verfügbar'}</h3>
                <p>${item.overview || 'Keine Beschreibung verfügbar'}</p>
                ${seasonInfo}
                ${streamingInfo}
                <button onclick="closeDetailCard()" class="close-button">← Zurück</button>
            </div>
        </div>
    `;
    document.body.appendChild(detailCardOverlay);
}
 
// Funktion zum Schließen der Detailkarte
function closeDetailCard() {
    const overlay = document.querySelector('.detail-overlay');
    if (overlay) {
        overlay.remove();
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


    