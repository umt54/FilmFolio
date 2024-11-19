const apiKey = 'b404d8bc1c229e9cb771c179755ad733';
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer b404d8bc1c229e9cb771c179755ad733'
    }
};

let selectedGenre = '';

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

        const [movieData, tvData] = await Promise.all([
            movieResponse.json(),
            tvResponse.json()
        ]);

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

        const allResults = [...movies, ...tvShows];
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
            `;

            // Click Event für die Vorschaukarte
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

// Modifizierte Version der Detailkartenanzeige
async function showDetailCard(item, container) {
    let seasonInfo = '';
    if (item.mediaType === 'tv') {
        const seriesDetails = await getSeriesDetails(item.id);
        if (seriesDetails) {
            const totalEpisodes = seriesDetails.seasons.reduce((sum, season) => sum + (season.episode_count || 0), 0);
            seasonInfo = `
                <p>Staffeln: ${seriesDetails.number_of_seasons}</p>
                <p>Folgen insgesamt: ${totalEpisodes}</p>
            `;
        }
    }

    const detailCard = document.createElement('div');
    detailCard.className = 'movie-card';
    detailCard.innerHTML = `
        <img src="${item.poster_path 
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
            : './images/no-poster.jpg'}" 
            alt="${item.title || 'Kein Titel verfügbar'}"
        >
        <div class="movie-info">
            <h3>${item.title || 'Kein Titel verfügbar'}</h3>
            <p>${item.overview || 'Keine Beschreibung verfügbar'}</p>
            <p>Bewertung: ${item.vote_average ? item.vote_average.toFixed(1) : 'Keine Bewertung'}/10</p>
            <p>Erscheinungsdatum: ${item.release_date || 'Kein Datum verfügbar'}</p>
            <p>Typ: ${item.mediaType === 'movie' ? 'Film' : 'Serie'}</p>
            ${seasonInfo}
            <button onclick="addToFavorites(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                Zu Favoriten hinzufügen
            </button>
            <button onclick="performSearch()">Zurück zur Suche</button>
        </div>
    `;
    container.innerHTML = '';
    container.appendChild(detailCard);
}

// Zufälliger Film/Serie Generator (unabhängig von der Suche)
document.getElementById('randomMovie').addEventListener('click', async () => {
    try {
        const mediaType = Math.random() < 0.5 ? 'movie' : 'tv';
        let apiUrl;

        if (selectedGenre) {
            apiUrl = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}&language=de&with_genres=${selectedGenre}`;
        } else {
            apiUrl = `https://api.themoviedb.org/3/${mediaType}/popular?api_key=${apiKey}&language=de`;
        }

        const response = await fetch(apiUrl, options);
        const data = await response.json();
        
        const movieResults = document.getElementById('movieResults');
        
        if (!data.results || data.results.length === 0) {
            movieResults.innerHTML = '<p>Keine Ergebnisse gefunden</p>';
            return;
        }

        const randomIndex = Math.floor(Math.random() * data.results.length);
        const randomItem = data.results[randomIndex];
        randomItem.mediaType = mediaType;
        
        movieResults.innerHTML = '';
        
        showDetailCard(randomItem, movieResults);
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        document.getElementById('movieResults').innerHTML = '<p>Ein Fehler ist aufgetreten</p>';
    }
});

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

// Hamburger Menü klickbar machen
document.getElementById('hamburger').addEventListener('click', (e) => {
    e.stopPropagation(); // Verhindert, dass der Klick außerhalb triggert
    const dropdown = document.getElementById('dropdown');
    dropdown.classList.toggle('show');
});

// Schließt das Dropdown bei Klick außerhalb
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdown');
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
});


// Anmelde-Link
document.getElementById('loginLink').addEventListener('click', () => {
    window.location.href = 'login.html'; // Subpage für Anmelden
});

// Abmelde-Link (optional)
document.getElementById('logoutLink').addEventListener('click', () => {
    // Hier können Sie die Abmeldefunktionalität hinzufügen
    alert('Abgemeldet!');
});

function toggleDropdown() {
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Optional: Schließe das Dropdown, wenn auf einen Link geklickt wird
document.querySelectorAll('.dropdown a').forEach(link => {
    link.addEventListener('click', function() {
        // Hier kannst du das Dropdown schließen, wenn gewünscht
        // document.getElementById('dropdown').style.display = 'none';
    });
}); 