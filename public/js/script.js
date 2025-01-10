document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const ingredientButton = document.querySelector('.addIngredient');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content-body');
    const closeModalButton = document.querySelector('.close-btn');
    
    
        // Function to generate project content
        function loadModalContent() {
            return `
                <!-- Add Ingredient Form -->
                <div class="container">
                    <div class="row align-items-center justify-content-center">
                        <!-- Add Ingredient Section -->
                        <div class="col">
                            <h2 class="text-center text-avocado mb-4">Add Ingredient</h2>
                            <form action="/add-ingredient" method="POST">
                                <!-- Ingredient Name Input -->
                                <div class="form-group mb-3">
                                    <label for="ingredient-name" class="form-label text-avocado">Ingredient Name</label>
                                    <input required placeholder="Enter ingredient name" type="text" name="ingredientName" id="ingredient-name" class="form-control cred-input">
                                </div>
                                <!-- Quantity Input with Dropdown -->
                                <div class="form-group mb-3">
                                    <label for="quantity" class="form-label text-avocado">Quantity</label>
                                    <div class="input-group">
                                        <!-- Quantity Input -->
                                        <input required placeholder="Enter quantity" type="number" name="quantity" id="quantity" class="form-control cred-input">                                        <!-- Dropdown on the left -->
                                        <div class="input-group-prepend">
                                            <select name="quantityUnit" id="quantity-unit" class="form-select cred-input">
                                                <option value="grams">Grams</option>
                                                <option value="kg">Kilograms</option>
                                                <option value="ml">Milliliters</option>
                                                <option value="liters">Liters</option>
                                                <option value="pieces">Pieces</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <!-- Category Input -->
                                <div class="form-group mb-3">
                                    <label for="category" class="form-label text-avocado">Category</label>
                                    <select name="category" id="category" class="form-control cred-input">
                                        <option value="vegetables">Vegetables</option>
                                        <option value="fruits">Fruits</option>
                                        <option value="meat">Meat</option>
                                        <option value="dairy">Dairy</option>
                                        <option value="grains">Grains</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <!-- Submit Button -->
                                <div class="text-center">
                                    <button class="btn btn-avocado btn-lg w-100" type="submit">Add Ingredient</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        }
    
    // Add click event listener to the single button
    if (ingredientButton) {
        ingredientButton.addEventListener('click', () => {
            const content = loadModalContent(); // Generate content
            modalContent.innerHTML = content; // Insert content into modal
            modalOverlay.style.display = 'flex'; // Show the modal overlay
        });
    }
    
    function closeModal() { 
        modalOverlay.style.display = 'none';  // Hide the modal
    }
    
    // Close the modal from the exit button
    closeModalButton.addEventListener('click', () => {
        closeModal();
    });
    
    // Close the modal if the user clicks outside the modal content
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });
    }  
});