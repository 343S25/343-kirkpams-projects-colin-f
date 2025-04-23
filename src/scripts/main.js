// Configuration
const API_KEY = 'f941a8e93d714061b3cdb6ade402e1bd';
const BASE_URL = 'https://api.spoonacular.com/recipes';

// DOM Elements
const elements = {
  searchForm: document.getElementById('search-form'),
  recipeGrid: document.querySelector('.favorites-grid'),
  favoritesList: document.querySelector('.favorites-ul'),
  loading: document.getElementById('loading'),
  errorBox: document.getElementById('error-message')
};

// Initialize empty favorites
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Initialize the app
function init() {
  loadFavorites();
  setupEventListeners();
}

// Load favorites from localStorage
function loadFavorites() {
  elements.favoritesList.innerHTML = '';
  elements.recipeGrid.innerHTML = '';

  favorites.forEach((recipe, index) => {
    addFavoriteToList(recipe);
    if (index < 4) addFavoriteToGrid(recipe);
  });

  // Fill empty grid slots
  for (let i = favorites.length; i < 4; i++) {
    elements.recipeGrid.innerHTML += `
      <div class="favorite-recipe empty-slot">
        <div>Empty Slot</div>
      </div>
    `;
  }
}

// Add recipe to favorites list
function addFavoriteToList(recipe) {
  const li = document.createElement('li');
  li.innerHTML = `
    <span class="recipe-name">${recipe.title}</span>
    <span class="recipe-meta">${recipe.calories} cal | ${recipe.protein}g protein</span>
  `;
  li.addEventListener('click', toggleSelection);
  elements.favoritesList.appendChild(li);
}

// Add recipe to favorites grid
function addFavoriteToGrid(recipe) {
  const gridItem = document.createElement('div');
  gridItem.className = 'favorite-recipe';
  gridItem.innerHTML = `
    <img src="${recipe.image}" alt="${recipe.title}">
    <h3>${recipe.title}</h3>
    <div class="nutrition-info">
      <span>${recipe.calories} cal</span>
      <span>${recipe.protein}g protein</span>
    </div>
  `;
  elements.recipeGrid.appendChild(gridItem);
}

// Setup event listeners
function setupEventListeners() {
  // Search form
  elements.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = e.target.query.value.trim();
    if (query) window.location.href = `search.html?query=${encodeURIComponent(query)}`;
  });

  // Add recipe button
  document.querySelector('.add-btn').addEventListener('click', addNewFavorite);

  // Remove selected button
  document.querySelector('.remove-btn').addEventListener('click', removeSelected);
}

// Add new favorite
async function addNewFavorite() {
  try {
    const query = prompt("Search for recipe to add:");
    if (!query) return;

    const response = await fetch(`${BASE_URL}/complexSearch?query=${query}&number=5&apiKey=${API_KEY}`);
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    const recipeList = data.results.map((r, i) => `${i+1}. ${r.title}`).join('\n');
    
    const selection = prompt(`Found recipes:\n${recipeList}\nEnter number to add:`);
    const selected = data.results[parseInt(selection)-1];
    
    if (selected) {
      // Get nutrition info (simplified - in reality you'd need another API call)
      const newFavorite = {
        id: selected.id,
        title: selected.title,
        image: selected.image,
        calories: Math.floor(Math.random() * 500) + 200, // Mock data
        protein: Math.floor(Math.random() * 30) + 5      // Mock data
      };
      
      favorites.push(newFavorite);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      loadFavorites();
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
    alert('Failed to add recipe');
  }
}

// Remove selected favorites
function removeSelected() {
  const selected = document.querySelectorAll('.favorites-ul li.selected');
  if (selected.length === 0) return alert('Please select recipes first');
  
  if (confirm(`Remove ${selected.length} selected recipes?`)) {
    const selectedNames = Array.from(selected).map(item => 
      item.querySelector('.recipe-name').textContent
    );
    
    favorites = favorites.filter(recipe => !selectedNames.includes(recipe.title));
    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadFavorites();
  }
}

// Toggle selection
function toggleSelection() {
  this.classList.toggle('selected');
}

// Initialize the app
init();