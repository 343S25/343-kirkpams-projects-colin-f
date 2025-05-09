const API_KEY = 'f941a8e93d714061b3cdb6ade402e1bd';
const BASE_URL = 'https://api.spoonacular.com/recipes';
const NUTRITIONIX_APP_ID = '6b080cbb';
const NUTRITIONIX_API_KEY = 'de94d32595f5e3d2d3a49b729fbcaffd';
const NUTRITIONIX_ENDPOINT = 'https://trackapi.nutritionix.com/v2/natural/nutrients';

const elements = {
  mealsGrid: document.querySelector('.meals-grid'),
  favoritesGrid: document.querySelector('.favorites-grid'),
  favoritesList: document.querySelector('.favorites-ul'),
  helpBtn: document.getElementById('help-btn'),
  recipeSearchForm: document.getElementById('recipe-search-form'),
  recipeQuery: document.getElementById('recipe-query'),
  recipeResults: document.getElementById('recipe-results'),
  removeBtn: document.querySelector('.remove-btn'),
  proteinTotal: document.getElementById('protein-total'),
  carbsTotal: document.getElementById('carbs-total'),
  fatTotal: document.getElementById('fat-total')
};

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let dailyTotals = {
  protein: 0,
  carbs: 0,
  fat: 0
};

function init() {
  loadFavorites();
  setupEventListeners();
  updateTrackerDisplay();
  // Initialize meals grid with empty state
  elements.mealsGrid.innerHTML = '<div class="empty-slot">No meals added today</div>';
}

async function getNutritionDetails(recipeTitle) {
  const errorElement = document.getElementById('nutrition-error');
  errorElement.style.display = 'none';

  try {
    const response = await fetch(NUTRITIONIX_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': NUTRITIONIX_APP_ID,
        'x-app-key': NUTRITIONIX_API_KEY
      },
      body: JSON.stringify({
        query: recipeTitle,
        timezone: 'US/Eastern',
        aggregate: 'recipe',
        line_delimited: false
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    if (!data.foods?.length) {
      console.warn('No nutrition data found for:', recipeTitle);
      return null;
    }

    const food = data.foods[0];
    return {
      calories: Math.round(food.nf_calories) || 0,
      protein: Math.round(food.nf_protein) || 0,
      carbs: Math.round(food.nf_total_carbohydrate) || 0,
      fat: Math.round(food.nf_total_fat) || 0,
      servingSize: food.serving_qty + ' ' + (food.serving_unit || 'serving')
    };
  } catch (error) {
    errorElement.textContent = `Nutrition data unavailable: ${error.message}`;
    errorElement.style.display = 'block';
    return null;
  }
}

function updateTrackerDisplay() {
  elements.proteinTotal.textContent = `${dailyTotals.protein}g`;
  elements.carbsTotal.textContent = `${dailyTotals.carbs}g`;
  elements.fatTotal.textContent = `${dailyTotals.fat}g`;
}

function setupEventListeners() {
  elements.helpBtn.addEventListener('click', () => {
    window.location.href = 'help.html';
  });

  elements.recipeSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = elements.recipeQuery.value.trim();
    if (query) await performRecipeSearch(query);
  });

  elements.removeBtn.addEventListener('click', removeSelected);
}

function loadFavorites() {
  elements.favoritesList.innerHTML = '';
  elements.favoritesGrid.innerHTML = '';

  if (favorites.length === 0) {
    // Add empty slots to favorites grid only
    for (let i = 0; i < 4; i++) {
      elements.favoritesGrid.innerHTML += `
        <div class="favorite-recipe empty-slot">
          <div>Empty Slot</div>
        </div>
      `;
    }
    return;
  }

  favorites.forEach((recipe, index) => {
    addFavoriteToList(recipe);
    if (index < 4) {
      addFavoriteToGrid(recipe);
    }
  });

  // Fill remaining slots if less than 4 favorites
  for (let i = favorites.length; i < 4; i++) {
    elements.favoritesGrid.innerHTML += `
      <div class="favorite-recipe empty-slot">
        <div>Empty Slot</div>
      </div>
    `;
  }
}

function addFavoriteToList(recipe) {
  const li = document.createElement('li');
  li.dataset.id = recipe.id; // Store the ID on the li element
  li.innerHTML = `
    <span class="recipe-name">${recipe.title}</span>
    <span class="recipe-meta">
      ${recipe.calories} cal | 
      ${recipe.servingSize} |
      P:${recipe.protein}g C:${recipe.carbs}g F:${recipe.fat}g
    </span>
  `;
  li.addEventListener('click', toggleSelection);
  elements.favoritesList.appendChild(li);
}

function addMealToGrid(recipe, nutrition) {
  // Clear empty slot if it exists
  const emptySlot = elements.mealsGrid.querySelector('.empty-slot');
  if (emptySlot) {
    elements.mealsGrid.removeChild(emptySlot);
  }

  const mealElement = document.createElement('div');
  mealElement.className = 'favorite-recipe';
  mealElement.innerHTML = `
    <img src="${recipe.image}" alt="${recipe.title}">
    <h3>${recipe.title}</h3>
    <div class="nutrition-info">
      <span>${nutrition.calories} cal (${nutrition.servingSize})</span>
      <div class="macros">
        <span class="protein">P:${nutrition.protein}g</span>
        <span class="carbs">C:${nutrition.carbs}g</span>
        <span class="fat">F:${nutrition.fat}g</span>
      </div>
    </div>
  `;
  elements.mealsGrid.appendChild(mealElement);
}

function addFavoriteToGrid(recipe) {
  const gridItem = document.createElement('div');
  gridItem.className = 'favorite-recipe';
  gridItem.innerHTML = `
    <img src="${recipe.image}" alt="${recipe.title}">
    <h3>${recipe.title}</h3>
    <div class="nutrition-info">
      <span>${recipe.calories} cal (${recipe.servingSize})</span>
      <div class="macros">
        <span class="protein">P:${recipe.protein}g</span>
        <span class="carbs">C:${recipe.carbs}g</span>
        <span class="fat">F:${recipe.fat}g</span>
      </div>
    </div>
  `;
  elements.favoritesGrid.appendChild(gridItem);
}

async function performRecipeSearch(query) {
  try {
    elements.recipeResults.innerHTML = '<p>Searching...</p>';
    
    const response = await fetch(`${BASE_URL}/complexSearch?query=${encodeURIComponent(query)}&number=6&apiKey=${API_KEY}`);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      elements.recipeResults.innerHTML = '<p>No recipes found. Try a different search.</p>';
      return;
    }
    
    elements.recipeResults.innerHTML = data.results.map(recipe => `
      <div class="search-result" data-id="${recipe.id}">
        <img src="${recipe.image}" alt="${recipe.title}">
        <div class="search-result-info">
          <h3>${recipe.title}</h3>
          <div class="recipe-actions">
            <button class="add-meal-btn" data-id="${recipe.id}">Add to Today</button>
            <button class="add-favorite-btn" data-id="${recipe.id}">★ Add to Favorites</button>
          </div>
        </div>
      </div>
    `).join('');
    
    // Add to Today's Meals button
    document.querySelectorAll('.add-meal-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const recipeId = parseInt(btn.dataset.id);
        const recipe = data.results.find(r => r.id === recipeId);
        const originalText = btn.textContent;
        
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>';
        
        try {
          const nutrition = await getNutritionDetails(recipe.title);
          
          if (nutrition) {
            dailyTotals.protein += nutrition.protein;
            dailyTotals.carbs += nutrition.carbs;
            dailyTotals.fat += nutrition.fat;
            updateTrackerDisplay();
            addMealToGrid(recipe, nutrition);
          }
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });
    });
    
    // Add to Favorites button
    document.querySelectorAll('.add-favorite-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const recipeId = parseInt(btn.dataset.id);
        const recipe = data.results.find(r => r.id === recipeId);
        
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>';
        
        try {
          const nutrition = await getNutritionDetails(recipe.title);
          
          const newFavorite = {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            calories: nutrition?.calories || 0,
            protein: nutrition?.protein || 0,
            carbs: nutrition?.carbs || 0,
            fat: nutrition?.fat || 0,
            servingSize: nutrition?.servingSize || '1 serving',
            addedAt: new Date().toISOString()
          };
          
          if (!favorites.some(fav => fav.id === recipe.id)) {
            favorites.push(newFavorite);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            loadFavorites();
            btn.innerHTML = '★ Added!';
          } else {
            btn.innerHTML = '★ Already in Favorites';
          }
        } finally {
          setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '★ Add to Favorites';
          }, 2000);
        }
      });
    });
  } catch (error) {
    elements.recipeResults.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

function removeSelected() {
  const selected = document.querySelectorAll('.favorites-ul li.selected');
  if (selected.length === 0) {
    alert('Please select recipes first by clicking on them');
    return;
  }

  if (confirm(`Remove ${selected.length} selected recipes from favorites?`)) {
    // Get the IDs of selected recipes
    const selectedIds = Array.from(selected).map(item => {
      // Find the closest li element and get its data-id if available
      const li = item.closest('li');
      return li ? parseInt(li.dataset.id) : null;
    }).filter(id => id !== null);

    // Filter out the selected recipes
    favorites = favorites.filter(recipe => !selectedIds.includes(recipe.id));
    
    // Update localStorage and reload favorites
    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadFavorites();
  }
}

function toggleSelection() {
  const li = this.closest('li');
  if (li) {
    li.classList.toggle('selected');
    // Ensure we have the ID stored on the li element
    if (!li.dataset.id) {
      const recipeName = li.querySelector('.recipe-name').textContent;
      const recipe = favorites.find(fav => fav.title === recipeName);
      if (recipe) {
        li.dataset.id = recipe.id;
      }
    }
  }
}

init();