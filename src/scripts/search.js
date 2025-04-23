document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    
    if (!query) {
      window.location.href = 'index.html';
      return;
    }
  
    document.getElementById('search-form').querySelector('input').value = query;
    
    try {
      document.getElementById('results-container').innerHTML = '<p>Loading recipes...</p>';
      const results = await searchRecipes(query);
      displayResults(results);
    } catch (error) {
      console.error('Search error:', error);
      document.getElementById('results-container').innerHTML = `
        <p class="error">Failed to load results. Please try again.</p>
      `;
    }
  });
  
  async function searchRecipes(query) {
    const API_KEY = 'f941a8e93d714061b3cdb6ade402e1bd';
    const response = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=12&addRecipeInformation=true&apiKey=${API_KEY}`
    );
    
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  }
  
  function displayResults(data) {
    const container = document.getElementById('results-container');
    
    if (!data.results || data.results.length === 0) {
      container.innerHTML = '<p>No recipes found. Try a different search.</p>';
      return;
    }
  
    container.innerHTML = data.results.map(recipe => `
      <div class="recipe-card">
        <img src="${recipe.image}" alt="${recipe.title}">
        <div class="recipe-info">
          <h3>${recipe.title}</h3>
          <p>${recipe.readyInMinutes} mins • ${recipe.servings} servings</p>
          <a href="recipe.html?id=${recipe.id}" class="view-btn">View Recipe</a>
          <button class="save-btn" data-id="${recipe.id}">Save to Favorites</button>
        </div>
      </div>
    `).join('');
  
    // Add event listeners to save buttons
    document.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const recipeId = e.target.dataset.id;
        const recipe = data.results.find(r => r.id == recipeId);
        
        try {
          // In a real app, you would:
          // 1. Get detailed nutrition info
          // 2. Add to favorites array
          // 3. Update localStorage
          alert(`${recipe.title} saved to favorites!`);
        } catch (error) {
          console.error('Error saving recipe:', error);
          alert('Failed to save recipe');
        }
      });
    });
  }
  
  // Handle new searches
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = e.target.query.value.trim();
    if (query) window.location.href = `search.html?query=${encodeURIComponent(query)}`;
  });