// Function to create and initialize the AI model selection
function initializeAIModelSelection() {
    // Create the container for AI model selection
    const aiModelContainer = document.createElement('div');
    aiModelContainer.className = 'ai-model-container';
    
    // Add a label
    const label = document.createElement('p');
    label.textContent = 'Select AI Model for Match Processing:';
    aiModelContainer.appendChild(label);
    
    // Create the dropdown
    const selectElement = document.createElement('select');
    selectElement.id = 'aiModelSelect';
    
    // Add only DeepSeek as an option
    const option = document.createElement('option');
    option.value = 'deepseek';
    option.textContent = 'DeepSeek R1';
    selectElement.appendChild(option);
    
    // Add the dropdown to the container
    aiModelContainer.appendChild(selectElement);
    
    // Add the container before the start match button
    const startMatchBtn = document.getElementById('startMatchBtn');
    startMatchBtn.parentNode.insertBefore(aiModelContainer, startMatchBtn);
}

// Call the function to add the AI model selection
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Initialize the AI model selection
    initializeAIModelSelection();
    
    // ... existing code ...
}); 