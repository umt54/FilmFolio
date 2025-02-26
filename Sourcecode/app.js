import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
        // Setze currentType, wenn du z. B. nur Filme verarbeiten möchtest
        currentType = 'movie';
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
    
    // Bei Suchergebnissen wird currentType nicht gesetzt – deshalb
    // den "Mehr anzeigen"-Button ausblenden:
    document.getElementById('loadMoreButton').style.display = 'none';
    
    if (!results || results.length === 0) {
        container.innerHTML = `<div class="container"><p>Keine Ergebnisse gefunden.</p></div>`;
        return;
    }
    
    let html = '<div class="preview-grid">';
    // ... Rest deines Codes zur Erstellung der Suchergebnisse ...
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
    // Suchfeld-Listener (nur, wenn vorhanden)
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
  
    // Top100-Buttons (nur, wenn vorhanden)
    const top100MoviesButton = document.getElementById('top100MoviesButton');
    if (top100MoviesButton) {
      top100MoviesButton.addEventListener('click', () => {
        currentPage = 1;
        window.currentType = 'movie';
        loadTopMovies();
      });
    }
  
    const top100SeriesButton = document.getElementById('top100SeriesButton');
    if (top100SeriesButton) {
      top100SeriesButton.addEventListener('click', () => {
        currentPage = 1;
        window.currentType = 'tv';
        loadTopSeries();
      });
    }

    
  
    // Zufälliger Film (nur, wenn vorhanden)
    const randomMovieButton = document.getElementById('randomMovieButton');
    if (randomMovieButton) {
      randomMovieButton.addEventListener('click', showRandomMovie);
    }
  
    // "Mehr anzeigen"-Button (nur, wenn vorhanden)
    const loadMoreButton = document.getElementById('loadMoreButton');
    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', async () => {
        const movieResults = document.getElementById('movieResults');
        const grid = movieResults ? movieResults.querySelector('.preview-grid') : null;
        if (!grid || !window.currentType) {
          console.error('Grid oder currentType nicht gefunden');
          return;
        }
        try {
          window.currentPage++;
          const response = await fetch(`https://api.themoviedb.org/3/${window.currentType}/top_rated?api_key=${apiKey}&language=de&page=${window.currentPage}`);
          if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
          }
          const data = await response.json();
          data.results.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'preview-card';
            const title = window.currentType === 'movie' ? item.title : item.name;
            const date = window.currentType === 'movie' ? item.release_date : item.first_air_date;
            card.innerHTML = `
              <div class="rank-badge">#${((window.currentPage - 1) * 20) + index + 1}</div>
              <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${title}">
              <div class="card-content">
                <h3>${title}</h3>
                <p class="rating">⭐ ${item.vote_average.toFixed(1)}/10</p>
                <p class="release-year">${date ? new Date(date).getFullYear() : 'N/A'}</p>
              </div>
            `;
            grid.appendChild(card);
          });
          if (window.currentPage >= 5) {
            loadMoreButton.style.display = 'none';
          }
        } catch (error) {
          console.error('Fehler beim Laden weiterer Titel:', error);
          movieResults.innerHTML = `<p>Fehler beim Laden weiterer Titel: ${error.message}</p>`;
        }
      });
    }
    
  
    // Standardmäßig Top Filme laden, falls #movieResults existiert (Startseite)
    if (document.getElementById('movieResults')) {
      window.currentType = 'movie';
      window.currentPage = 1;
      loadTopMovies();
    }
    
  });
  

// Funktion im globalen Kontext verfügbar machen
window.showDetailCard = showDetailCard;

// Export der Funktionen

 
let selectedGenre = '';
let currentPage = 1;
window.currentPage = currentPage;        // global
let allResults = []; // Alle bisher geladenen Ergebnisse
let favorites = []; // Favoriten-Array
let isLoading = false;

// Event Listener für die Suchfunktion
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}
 
async function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (!searchTerm) return;
 
    try {
        const movieResults = document.getElementById('movieResults');
        movieResults.innerHTML = '<div class="loading">Suche läuft...</div>';
 
        const [movieResponse, tvResponse] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=de&query=${encodeURIComponent(searchTerm)}`),
            fetch(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=de&query=${encodeURIComponent(searchTerm)}`)
        ]);
 
        // Überprüfen, ob die Antworten erfolgreich sind
        if (!movieResponse.ok || !tvResponse.ok) {
            throw new Error('Fehler bei der API-Anfrage');
        }
 
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
            <div class="preview-card" onclick='window.showDetailCard(${JSON.stringify(itemData)
                    .replace(/'/g, "&apos;")
                    .replace(/"/g, "&quot;")})'>
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
    
    // Zeige den "Mehr anzeigen"-Button, da wir im Top100-Modus sind:
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
  
    // Neues Layout: Zwei Spalten (linke Spalte: Poster + Aktionsbuttons, rechte Spalte: Titel & Beschreibung)
    const detailCardOverlay = document.createElement('div');
    detailCardOverlay.className = 'detail-overlay';
    detailCardOverlay.innerHTML = `
      <div class="movie-card">
        <div class="left-panel">
          <div class="movie-poster">
            <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : './images/no-poster.jpg'}" alt="${item.title || 'Kein Titel verfügbar'}">
          </div>
          <div class="info-grid">
            <p>⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</p>
            <p>📅 ${releaseYear}</p>
            <p>🎬 ${item.mediaType === 'movie' ? 'Film' : 'Serie'}</p>
          </div>
          ${streamingInfo}
          <div class="action-buttons">
            <!-- Linke Gruppe: Zurück-Button -->
            <div class="left-group">
              <button class="close-button">Zurück</button>
            </div>
            <!-- Rechte Gruppe: Watched, Planned, Favorit (Herz) -->
            <div class="right-group">
              <button class="watched-button">Watched</button>
              <button class="planned-button">Planned to Watch</button>
              <button class="favorite-button">
                <span class="heart-icon">&#9825;</span>
              </button>
            </div>
          </div>
        </div>
        <div class="right-panel">
          <div class="info-container">
            <h3 class="movie-title">${item.title || 'Kein Titel verfügbar'}</h3>
            <p class="movie-description">${item.overview || 'Keine Beschreibung verfügbar'}</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(detailCardOverlay);
  
    // Schließe-Button
    const closeButton = detailCardOverlay.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        detailCardOverlay.remove();
      });
    }
  
    // Event-Listener für die Buttons (Watched, Planned, Favorit)
    const watchedButton = detailCardOverlay.querySelector('.watched-button');
    const plannedButton = detailCardOverlay.querySelector('.planned-button');
  
    if (watchedButton) {
      watchedButton.addEventListener('click', () => toggleWatched(item));
    }
  
    if (plannedButton) {
      plannedButton.addEventListener('click', () => togglePlanned(item));
    }
  
    // Favoriten-Button als Herz
    const favoriteButton = detailCardOverlay.querySelector('.favorite-button');
    favoriteButton.addEventListener('click', async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          alert('Bitte melden Sie sich an, um Filme zu Ihren Favoriten hinzuzufügen.');
          return;
        }
        const favoritesRef = collection(db, 'favorites', user.uid, 'titles');
        const favoriteDocRef = doc(favoritesRef, item.id.toString());
        const docSnap = await getDoc(favoriteDocRef);
        const heartIcon = favoriteButton.querySelector('.heart-icon');
        if (docSnap.exists()) {
          await deleteDoc(favoriteDocRef);
          favoriteButton.classList.remove('favorited');
          if (heartIcon) {
            heartIcon.textContent = '♡';
          }
          showFavoritePopup("Titel aus Favoriten entfernt");
        } else {
          await setDoc(favoriteDocRef, item);
          favoriteButton.classList.add('favorited');
          if (heartIcon) {
            heartIcon.textContent = '♥';
          }
          showFavoritePopup("Titel zu Favoriten hinzugefügt");
        }
      } catch (error) {
        console.error('Fehler beim Hinzufügen/Entfernen zu den Favoriten:', error);
      }
    });
  
    // Optional: Initialen Favoriten-Status prüfen
    (async function checkFavoriteState() {
      const user = auth.currentUser;
      if (user) {
        const favoritesRef = collection(db, 'favorites', user.uid, 'titles');
        const favoriteDocRef = doc(favoritesRef, item.id.toString());
        const docSnap = await getDoc(favoriteDocRef);
        const heartIcon = favoriteButton.querySelector('.heart-icon');
        if (docSnap.exists()) {
          favoriteButton.classList.add('favorited');
          if (heartIcon) {
            heartIcon.textContent = '♥';
          }
        } else {
          favoriteButton.classList.remove('favorited');
          if (heartIcon) {
            heartIcon.textContent = '♡';
          }
        }
      }
    })();
  }
  
  
  
  







// Top 100 Filme Button
// Top 100 Filme Button
const top100MoviesButton = document.getElementById('top100MoviesButton');
if (top100MoviesButton) {
    top100MoviesButton.addEventListener('click', () => {
        window.currentPage = 1;
        window.currentType = 'movie';
        loadTopMovies();
    });
}

const top100SeriesButton = document.getElementById('top100SeriesButton');
if (top100SeriesButton) {
    top100SeriesButton.addEventListener('click', () => {
        window.currentPage = 1;
        window.currentType = 'tv';
        loadTopSeries();
    });
}



// Mehr anzeigen Button
const loadMoreButton = document.getElementById('loadMoreButton');
if (loadMoreButton) {
  loadMoreButton.addEventListener('click', async () => {
      const movieResults = document.getElementById('movieResults');
      const grid = movieResults.querySelector('.preview-grid');
      
      if (!grid || !window.currentType) {
          console.error('Grid oder currentType nicht gefunden');
          return;
      }
      
      try {
          window.currentPage++;
          const response = await fetch(`https://api.themoviedb.org/3/${window.currentType}/top_rated?api_key=${apiKey}&language=de&page=${window.currentPage}`);
          if (!response.ok) {
              throw new Error('Netzwerk-Antwort war nicht ok');
          }
          const data = await response.json();
          
          data.results.forEach((item, index) => {
              const card = document.createElement('div');
              card.className = 'preview-card';
              const title = window.currentType === 'movie' ? item.title : item.name;
              const date = window.currentType === 'movie' ? item.release_date : item.first_air_date;
              card.innerHTML = `
                  <div class="rank-badge">#${((window.currentPage - 1) * 20) + index + 1}</div>
                  <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${title}">
                  <div class="card-content">
                      <h3>${title}</h3>
                      <p class="rating">⭐ ${item.vote_average.toFixed(1)}/10</p>
                      <p class="release-year">${date ? new Date(date).getFullYear() : 'N/A'}</p>
                  </div>
              `;
              grid.appendChild(card);
          });
          
          if (window.currentPage >= 5) {
              loadMoreButton.style.display = 'none';
          }
      } catch (error) {
          console.error('Fehler beim Laden weiterer Titel:', error);
          movieResults.innerHTML = `<p>Fehler beim Laden weiterer Titel: ${error.message}</p>`;
      }
  });
} else {
  console.error("Element mit ID 'loadMoreButton' wurde nicht gefunden.");
}

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
// Favoriten laden – Container: "favoritesContainer"
async function loadFavorites() {
    try {
      console.log("loadFavorites aufgerufen. Aktueller User:", auth.currentUser);
      if (!auth.currentUser) {
        document.getElementById('favoritesContainer').innerHTML = `
          <div class="container">
            <h2>Meine Favoriten</h2>
            <p>Bitte anmelden, um deine Favoriten zu sehen.</p>
          </div>`;
        return;
      }
      
      const favoritesRef = collection(db, 'favorites', auth.currentUser.uid, 'titles');
      const querySnapshot = await getDocs(favoritesRef);
      console.log("Favoriten-Dokumente gefunden:", querySnapshot.size);
    
      const container = document.getElementById('favoritesContainer');
      if (!container) {
        console.error("Container mit der ID 'favoritesContainer' nicht gefunden");
        return;
      }
    
      if (querySnapshot.empty) {
        container.innerHTML = `
          <div class="container">
            <h2>Meine Favoriten</h2>
            <p>Du hast noch keine Favoriten gespeichert.</p>
          </div>`;
        return;
      }
    
      let html = `
        <div class="container">
          <h2>Meine Favoriten</h2>
          <div class="preview-grid">
      `;
    
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
        html += `
          <div class="preview-card" onclick='showDetailCard(${itemJson})'>
            <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : './images/no-poster.jpg'}" alt="${item.title}">
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
    
      html += `
          </div>
        </div>
      `;
    
      container.innerHTML = html;
      console.log('Favoriten wurden geladen und angezeigt');
    } catch (error) {
      console.error('Fehler beim Laden der Favoriten:', error);
      const container = document.getElementById('favoritesContainer');
      container.innerHTML = `
        <div class="container">
          <h2>Meine Favoriten</h2>
          <p>Fehler beim Laden der Favoriten: ${error.message}</p>
        </div>`;
    }
  }
    
  // Watched-Titel laden – Container: "watchedContainer"
async function loadWatched() {
    try {
      console.log("loadWatched aufgerufen. Aktueller User:", auth.currentUser);
      if (!auth.currentUser) {
        document.getElementById('watchedContainer').innerHTML = `
          <div class="container">
            <h2>Bereits gesehen</h2>
            <p>Bitte anmelden, um deine Watched-Titel zu sehen.</p>
          </div>`;
        return;
      }
      
      const watchedRef = collection(db, 'watched', auth.currentUser.uid, 'titles');
      const querySnapshot = await getDocs(watchedRef);
      console.log("Watched-Dokumente gefunden:", querySnapshot.size);
    
      const container = document.getElementById('watchedContainer');
      if (!container) {
        console.error("Container mit der ID 'watchedContainer' nicht gefunden");
        return;
      }
    
      if (querySnapshot.empty) {
        container.innerHTML = `
          <div class="container">
            <h2>Bereits gesehen</h2>
            <p>Du hast noch keine Titel als "Watched" markiert.</p>
          </div>`;
        return;
      }
    
      let html = `
        <div class="container">
          <h2>Bereits gesehen</h2>
          <div class="preview-grid">
      `;
    
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
        html += `
          <div class="preview-card" onclick='showDetailCard(${itemJson})'>
            <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : './images/no-poster.jpg'}" alt="${item.title}">
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
    
      html += `
          </div>
        </div>
      `;
    
      container.innerHTML = html;
      console.log('Watched-Titel wurden geladen und angezeigt');
    } catch (error) {
      console.error('Fehler beim Laden der Watched-Titel:', error);
      const container = document.getElementById('watchedContainer');
      container.innerHTML = `
        <div class="container">
          <h2>Bereits gesehen</h2>
          <p>Fehler beim Laden der Watched-Titel: ${error.message}</p>
        </div>`;
    }
  }
    
  // Planned to Watch laden – Container: "plannedContainer"
async function loadPlanned() {
    try {
      console.log("loadPlanned aufgerufen. Aktueller User:", auth.currentUser);
      if (!auth.currentUser) {
        document.getElementById('plannedContainer').innerHTML = `
          <div class="container">
            <h2>Geplant zu sehen</h2>
            <p>Bitte anmelden, um deine Planned-Titel zu sehen.</p>
          </div>`;
        return;
      }
      
      const plannedRef = collection(db, 'planned', auth.currentUser.uid, 'titles');
      const querySnapshot = await getDocs(plannedRef);
      console.log("Planned-Dokumente gefunden:", querySnapshot.size);
    
      const container = document.getElementById('plannedContainer');
      if (!container) {
        console.error("Container mit der ID 'plannedContainer' nicht gefunden");
        return;
      }
    
      if (querySnapshot.empty) {
        container.innerHTML = `
          <div class="container">
            <h2>Geplant zu sehen</h2>
            <p>Du hast noch keine Titel als "Planned to Watch" markiert.</p>
          </div>`;
        return;
      }
    
      let html = `
        <div class="container">
          <h2>Geplant zu sehen</h2>
          <div class="preview-grid">
      `;
    
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
        html += `
          <div class="preview-card" onclick='showDetailCard(${itemJson})'>
            <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : './images/no-poster.jpg'}" alt="${item.title}">
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
    
      html += `
          </div>
        </div>
      `;
    
      container.innerHTML = html;
      console.log('Planned-Titel wurden geladen und angezeigt');
    } catch (error) {
      console.error('Fehler beim Laden der Planned-Titel:', error);
      const container = document.getElementById('plannedContainer');
      container.innerHTML = `
        <div class="container">
          <h2>Geplant zu sehen</h2>
          <p>Fehler beim Laden der Planned-Titel: ${error.message}</p>
        </div>`;
    }
  }
  
// Event Listener für den Favoriten-Link


function updateNavigation(user) {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const favoritesLink = document.getElementById('favoritesLink');

    if (user) {
        // Wenn ein User angemeldet ist, blende den Anmelde-Button komplett aus,
        // damit er nicht mehr anklickbar ist
        if (loginLink) {
            loginLink.style.display = 'none';
        }
        // Zeige Logout- und Favoriten-Buttons und stelle sicher, dass sie klickbar sind
        if (logoutLink) {
            logoutLink.style.display = 'block';
            logoutLink.style.pointerEvents = 'auto';
        }
        if (favoritesLink) {
            favoritesLink.style.display = 'block';
            favoritesLink.style.pointerEvents = 'auto';
        }
    } else {
        // Wenn kein User angemeldet ist, zeige den Login-Button
        if (loginLink) {
            loginLink.style.display = 'block';
            loginLink.style.pointerEvents = 'auto';
        }
        // Verstecke Logout- und Favoriten-Buttons
        if (logoutLink) {
            logoutLink.style.display = 'none';
            logoutLink.style.pointerEvents = 'none';
        }
        if (favoritesLink) {
            favoritesLink.style.display = 'none';
            favoritesLink.style.pointerEvents = 'none';
        }
    }
}

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  console.log('Auth State Changed:', user);
  updateNavigation(user);

  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get("view") || "favorites";

  if (user) {
      if (view === "favorites") {
          loadFavorites();
      } else if (view === "watched") {
          loadWatched();
      } else if (view === "planned") {
          loadPlanned();
      }
  } else {
      const userContent = document.getElementById("userContent");
      userContent.innerHTML = "<p>Bitte anmelden, um deine Inhalte zu sehen.</p>";
  }
});




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

// Abmelde-Funktion
document.getElementById('logoutLink').addEventListener('click', async (e) => {
    e.preventDefault();
    if (e.target.classList.contains('disabled')) return;

    try {
        await signOut(auth);
        const popup = document.getElementById('logoutPopup');
        popup.style.display = 'block';
        setTimeout(() => {
            popup.style.display = 'none';
            window.location.reload();
        }, 2000);
    } catch (error) {
        console.error('Fehler beim Abmelden:', error);
        alert('Fehler beim Abmelden: ' + error.message);
    }
});

function showFavoritePopup(message) {
    let popup = document.getElementById('popup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'popup';
      popup.className = 'popup';
      document.body.appendChild(popup);
    }
    popup.textContent = message;
    popup.style.display = 'block';
    // Blende das Popup nach 2 Sekunden wieder aus
    setTimeout(() => {
      popup.style.display = 'none';
    }, 2000);
  }
  

  document.addEventListener('DOMContentLoaded', () => {
    const favoritesSection = document.getElementById('favorites');
    if (!favoritesSection) {
      console.error("Container mit der ID 'favorites' nicht gefunden");
    } else {
      console.log('favoritesSection:', favoritesSection);
      loadFavorites();
    }
  });


  document.addEventListener('DOMContentLoaded', () => {
    const favoritesSection = document.getElementById('favorites');
    if (!favoritesSection) {
      console.error("Container mit der ID 'favorites' nicht gefunden");
    } else {
      console.log('favoritesSection:', favoritesSection);
      loadFavorites();
    }
  });

  function getFavoritesContainer() {
    return document.getElementById('favorites') || document.getElementById('favoritesContainer');
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const favoritesSection = getFavoritesContainer();
    if (!favoritesSection) {
      console.error("Container für Favoriten nicht gefunden");
    } else {
      console.log('favoritesSection:', favoritesSection);
      loadFavorites();
    }
  });

  export { loadFavorites, loadWatched, loadPlanned, showDetailCard };

// Funktion zum Hinzufügen oder Entfernen von Titeln aus der Watched-Liste
async function toggleWatched(item) {
    const user = auth.currentUser;
    if (!user) {
        alert('Bitte melden Sie sich an, um Filme zu Ihrer Watched-Liste hinzuzufügen.');
        return;
    }
    const watchedRef = collection(db, 'watched', user.uid, 'titles');
    const watchedDocRef = doc(watchedRef, item.id.toString());

    try {
        console.log('Überprüfe, ob der Film in der Watched-Liste vorhanden ist:', item.title);
        const watchedSnap = await getDoc(watchedDocRef);
        if (watchedSnap.exists()) {
            await deleteDoc(watchedDocRef);
            console.log('Film aus Watched entfernt:', item.title);
            showFavoritePopup("Titel aus Watched entfernt");
        } else {
            await setDoc(watchedDocRef, item);
            console.log('Film zu Watched hinzugefügt:', item.title);
            showFavoritePopup("Titel zu Watched hinzugefügt");
        }
    } catch (error) {
        console.error('Fehler bei Watched:', error);
    }
}

// Funktion zum Hinzufügen oder Entfernen von Titeln aus der Planned-Liste
async function togglePlanned(item) {
    const user = auth.currentUser;
    if (!user) {
        alert('Bitte melden Sie sich an, um Filme zu Ihrer Planned-Liste hinzuzufügen.');
        return;
    }
    const plannedRef = collection(db, 'planned', user.uid, 'titles');
    const plannedDocRef = doc(plannedRef, item.id.toString());

    try {
        console.log('Überprüfe, ob der Film in der Planned-Liste vorhanden ist:', item.title);
        const plannedSnap = await getDoc(plannedDocRef);
        if (plannedSnap.exists()) {
            await deleteDoc(plannedDocRef);
            console.log('Film aus Planned entfernt:', item.title);
            showFavoritePopup("Titel aus Planned entfernt");
        } else {
            await setDoc(plannedDocRef, item);
            console.log('Film zu Planned hinzugefügt:', item.title);
            showFavoritePopup("Titel zu Planned hinzugefügt");
        }
    } catch (error) {
        console.error('Fehler bei Planned:', error);
    }
}