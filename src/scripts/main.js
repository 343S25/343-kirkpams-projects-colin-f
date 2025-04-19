document.querySelector('button').addEventListener('click', () => {
    const query = document.querySelector('input').value;
    alert(`Searching for: ${query}`); // Replace with Spoonacular API call
  });
  
  // Sample API Integration (using Spoonacular)
  async function fetchRecipes(query) {
    const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&apiKey=YOUR_KEY`);
    const data = await response.json();
    console.log(data.results);
  }