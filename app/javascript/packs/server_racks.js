document.addEventListener('DOMContentLoaded', initializeRackDragDrop);

// Make these variables global to the module scope
let rackVisualization;
let rackId;
let csrfToken;
let draggedComponent = null;
let originalPosition = null;
let componentHeight = 0;
let rackPositions = [];
let currentDropTargetPosition = null;

// Listen for the custom component-position-updated event
document.addEventListener('component-position-updated', handleComponentPositionUpdate);

// Handle the component position update event
function handleComponentPositionUpdate(event) {
    console.log('Component position update event received:', event.detail);
    
    const { componentId, oldPosition, newPosition, componentHeight } = event.detail;
    
    // Find the component that was moved
    const componentElement = document.querySelector(`.component[data-component-id="${componentId}"]`);
    if (!componentElement) {
        console.error(`Component with ID ${componentId} not found`);
        return;
    }
    
    // Get the parent rack-position element
    const oldPositionElement = componentElement.closest('.rack-position');
    if (!oldPositionElement) {
        console.error('Old position element not found');
        return;
    }
    
    // Calculate new top position
    const newTop = (newPosition - 1) * 40;
    
    // Animate the component moving to its new position with a smooth transition
    oldPositionElement.style.transition = 'top 0.5s ease-in-out';
    oldPositionElement.style.top = `${newTop}px`;
    
    // Update the data attributes
    oldPositionElement.dataset.position = newPosition;
    componentElement.dataset.position = newPosition;
    
    // After the animation completes, reinitialize the drag and drop
    setTimeout(() => {
        // Update the rack positions data without full reinitialization
        initRackPositions();
        setupDraggableComponents();
    }, 600);
}

// Main initialization function that we can call after DOM updates
function initializeRackDragDrop() {
    console.log("Initializing rack drag and drop functionality");
    
    // Find the rack visualization container
    rackVisualization = document.getElementById('server-front');
    if (!rackVisualization) {
        console.log("No rack visualization found, exiting");
        return; // Exit if we're not on a page with the visualization
    }
    
    // Get necessary data
    rackId = window.location.pathname.split('/').filter(Boolean).pop(); // Get rack ID from URL
    csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
    // Reset state
    draggedComponent = null;
    originalPosition = null;
    currentDropTargetPosition = null;
    
    // Initialize the rack positions
    initRackPositions();
    
    // Setup draggable components
    setupDraggableComponents();
    
    console.log("Rack drag and drop initialization complete");
}
    
    // Initialize rack positions array with all available U positions
function initRackPositions() {
    const rackHeight = parseInt(rackVisualization.style.height) / 40;
    rackPositions = [];
    
    // Create an array of all rack positions
    for (let i = 1; i <= rackHeight; i++) {
        // Each position has information about whether it's occupied
        rackPositions.push({
            position: i,
            occupied: false,
            componentId: null
        });
    }
    
    // Mark occupied positions
    document.querySelectorAll('.component').forEach(comp => {
        const position = parseInt(comp.dataset.position);
        const height = parseInt(comp.dataset.componentHeight);
        
        // Mark all positions this component occupies
        for (let i = position; i < position + height; i++) {
            const index = i - 1; // Convert to 0-based index
            if (index < rackPositions.length) {
                rackPositions[index].occupied = true;
                rackPositions[index].componentId = comp.dataset.componentId;
            }
        }
    });
}

// Handle drag start event
function handleDragStart(e) {
    draggedComponent = this;
    componentHeight = parseInt(this.dataset.componentHeight);
    originalPosition = parseInt(this.dataset.position);
    
    // Add visual cue for dragging
    setTimeout(() => {
        this.classList.add('opacity-50');
    }, 0);
    
    // Store component data in dataTransfer
    e.dataTransfer.setData('application/json', JSON.stringify({
        componentId: this.dataset.componentId,
        height: componentHeight,
        position: originalPosition
    }));
    
    // Set allowed drag effect
    e.dataTransfer.effectAllowed = 'move';
    
    // Show all drop zones
    showDropZones();
}

// Handle drag end event
function handleDragEnd() {
    this.classList.remove('opacity-50');
    hideDropZones();
    draggedComponent = null;
    
    // Refresh positions after drag operation
    initRackPositions();
}

// Setup draggable components
function setupDraggableComponents() {
    const components = document.querySelectorAll('.component[draggable="true"]');
    
    components.forEach(component => {
        // Remove existing listeners to avoid duplicates
        component.removeEventListener('dragstart', handleDragStart);
        component.removeEventListener('dragend', handleDragEnd);
        
        // Add new listeners
        component.addEventListener('dragstart', handleDragStart);
        component.addEventListener('dragend', handleDragEnd);
    });
}

// Show drop zones during drag
function showDropZones() {
    hideDropZones(); // Clear any existing drop zones first
    
    // Calculate rack dimensions
    const containerHeight = 40; // Each U is 40px high
    const rackHeight = parseInt(rackVisualization.style.height) / containerHeight;
    console.log(`Rack height: ${rackHeight} units`);
    
    // Create drop zones for ALL possible positions, including empty ones
    for (let i = 1; i <= rackHeight - componentHeight + 1; i++) {
        const canPlace = canPlaceComponentAt(i);
        
        // Look for an existing position element - typically this would be for positions 
        // that already have components in them
        const posElement = document.querySelector(`.rack-position[data-position="${i}"]`);
        
        if (posElement && posElement.querySelector('.component')) {
            // This position has a component already - show indicator only if it's the 
            // component we're currently dragging
            const dropIndicator = posElement.querySelector('.drop-indicator');
            
            if (canPlace) {
                // This is our own component or a valid drop target
                if (dropIndicator) {
                    dropIndicator.classList.remove('hidden');
                    dropIndicator.classList.remove('bg-red-100', 'border-red-500');
                    dropIndicator.classList.add('bg-green-100', 'border-green-500');
                }
            } else {
                // This is another component - can't drop here
                if (dropIndicator) {
                    dropIndicator.classList.remove('hidden');
                    dropIndicator.classList.remove('bg-green-100', 'border-green-500');
                    dropIndicator.classList.add('bg-red-100', 'border-red-500');
                }
            }
        } else {
            // This is an empty position - create a drop zone
            createDropZone(i, canPlace);
        }
    }
}

// Create a drop zone at a specific position
function createDropZone(position, isValid) {
    const dropZone = document.createElement('div');
    dropZone.className = `absolute rack-position drop-zone ${isValid ? 'valid-drop' : 'invalid-drop'}`;
    dropZone.style.top = `${(position - 1) * 40}px`;
    dropZone.style.height = `${componentHeight * 40}px`;
    dropZone.style.left = '30px';
    dropZone.style.right = '0';
    dropZone.dataset.position = position;
    dropZone.style.zIndex = '20'; // Higher z-index to ensure it's clickable
    
    // Add visual indicator - make empty slots more visible
    const indicator = document.createElement('div');
    
    if (isValid) {
        // Valid drop zone - empty slot
        indicator.className = 'absolute inset-0 border-2 border-dashed rounded-md border-green-500 bg-green-100 bg-opacity-30';
        
        // Add a drop label for empty slots
        const label = document.createElement('div');
        label.className = 'flex items-center justify-center h-full';
        label.innerHTML = `
            <div class="text-green-800 dark:text-green-200 font-medium text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                <div>Drop Here</div>
            </div>
        `;
        indicator.appendChild(label);
    } else {
        // Invalid drop zone
        indicator.className = 'absolute inset-0 border-2 border-dashed rounded-md border-red-500 bg-red-100 bg-opacity-30';
        
        // For invalid zones, show why they can't drop
        const label = document.createElement('div');
        label.className = 'flex items-center justify-center h-full';
        label.innerHTML = `
            <div class="text-red-800 dark:text-red-200 text-xs text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>Can't place here</div>
            </div>
        `;
        indicator.appendChild(label);
    }
    
    dropZone.appendChild(indicator);
    
    // Setup drop event handling
    if (isValid) {
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
    }
    
    rackVisualization.appendChild(dropZone);
    
    // Debug log
    console.log(`Created ${isValid ? 'valid' : 'invalid'} drop zone at position ${position}`);
}

// Handle dragover event
function handleDragOver(e) {
    if (!draggedComponent) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Visual feedback for the current drop target - enhance it
    const indicator = this.querySelector('div');
    if (indicator) {
        indicator.classList.add('bg-blue-300', 'dark:bg-blue-800', 'bg-opacity-50', 'border-blue-600', 'shadow-lg');
        indicator.classList.remove('border-green-500', 'bg-green-100');
        
        // Make the "Drop Here" text more prominent
        const textEl = indicator.querySelector('.text-green-800, .text-green-200');
        if (textEl) {
            textEl.className = 'text-blue-800 dark:text-blue-200 font-bold text-center';
            textEl.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 inline-block animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                <div>Release to Drop</div>
            `;
        }
    }
    
    currentDropTargetPosition = parseInt(this.dataset.position);
    
    // Debug log
    console.log(`Dragging over position ${currentDropTargetPosition}`);
}

// Handle dragleave event
function handleDragLeave(e) {
    // Only process if the leave is for this element, not a child
    if (e.currentTarget === this) {
        const indicator = this.querySelector('div');
        if (indicator) {
            indicator.classList.remove('bg-blue-300', 'dark:bg-blue-800', 'bg-opacity-50', 'border-blue-600', 'shadow-lg');
            indicator.classList.add('border-green-500', 'bg-green-100');
            
            // Restore the original "Drop Here" text
            const textEl = indicator.querySelector('.text-blue-800, .text-blue-200');
            if (textEl) {
                textEl.className = 'text-green-800 dark:text-green-200 font-medium text-center';
                textEl.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    <div>Drop Here</div>
                `;
            }
        }
        
        currentDropTargetPosition = null;
    }
}

// Handle drop event
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    if (!draggedComponent) {
        console.error('No dragged component found when drop occurred');
        return;
    }
    
    const newPosition = parseInt(this.dataset.position);
    console.log(`Dropping at position ${newPosition}`);
    
    // Don't do anything if dropping back to the original position
    if (newPosition === originalPosition) {
        console.log('Same position, ignoring drop');
        return;
    }
    
    // Update component position through AJAX call
    updateComponentPosition(draggedComponent.dataset.componentId, newPosition);
}

// Check if a component can be placed at a given position
function canPlaceComponentAt(position) {
    console.log(`Checking if can place at position ${position} (height: ${componentHeight})`);
    
    // Edge case: can't place component outside rack bounds
    if (position <= 0 || position + componentHeight - 1 > rackPositions.length) {
        console.log(`Position ${position} is out of bounds (rack height: ${rackPositions.length})`);
        return false;
    }
    
    // Check if any of the positions are occupied by other components
    for (let i = position; i < position + componentHeight; i++) {
        const posIndex = i - 1;
        if (posIndex >= rackPositions.length) {
            console.log(`Position index ${posIndex} is beyond rack bounds`);
            return false;
        }
        
        // If position is occupied by another component, can't place here
        // UNLESS it's the component we're currently dragging
        const draggedComponentId = draggedComponent ? draggedComponent.dataset.componentId : null;
        
        if (rackPositions[posIndex].occupied && 
            rackPositions[posIndex].componentId !== draggedComponentId) {
            console.log(`Position ${i} is occupied by component ${rackPositions[posIndex].componentId}`);
            return false;
        }
    }
    
    console.log(`Position ${position} is valid for placement`);
    return true;
}

// Hide all drop zones
function hideDropZones() {
    // Hide drop indicators
    document.querySelectorAll('.drop-indicator').forEach(indicator => {
        indicator.classList.add('hidden');
    });
    
    // Remove temporary drop zones
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.remove();
    });
}

// Update component position via Turbo Streams
function updateComponentPosition(componentId, newPosition) {
    // Find the rack visualization and fade it out slightly for smoother transition
    const rackViz = document.getElementById('server-rack-vizualization');
    if (rackViz) {
        rackViz.style.opacity = '0.7';
    }
    
    // Show loading overlay
    showLoadingOverlay();
    
    console.log(`Updating component ${componentId} to position ${newPosition}`);
    
    // Send AJAX request with Turbo Stream format
    fetch(`/racks/${rackId}/rack_components/${componentId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'Accept': 'text/vnd.turbo-stream.html, application/json'
        },
        body: JSON.stringify({
            position_y: newPosition
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update position');
        }
        
        return response.text();
    })
    .then(html => {
        // Process Turbo Stream response manually to ensure it works
        if (html && html.includes('turbo-stream')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const streams = doc.querySelectorAll('turbo-stream');
            
            streams.forEach(stream => {
                const action = stream.getAttribute('action');
                const target = stream.getAttribute('target');
                const template = stream.querySelector('template');
                
                if (action && target && template) {
                    const content = template.content.cloneNode(true);
                    const targetElement = document.getElementById(target);
                    
                    if (targetElement) {
                        if (action === 'replace') {
                            // Always update the content, but handle the visualization specially
                            targetElement.innerHTML = '';
                            targetElement.appendChild(content);
                            
                            // For the visualization, restore opacity for smooth transition
                            if (target === 'server-rack-vizualization') {
                                setTimeout(() => {
                                    targetElement.style.opacity = '1';
                                }, 50);
                            }
                        } else if (action === 'append') {
                            targetElement.appendChild(content);
                        } else if (action === 'prepend') {
                            targetElement.prepend(content);
                        }
                    }
                }
            });
            
            // Register a custom event to observe Turbo Stream updates
            // This event will be fired after Turbo processes all streams
            document.dispatchEvent(new CustomEvent('turbo-stream-render-complete'));
        } else {
            // If not a turbo stream response, reload the page as fallback
            window.location.reload();
            return;
        }
        
        // Hide the loading overlay after processing the response
        setTimeout(() => {
            hideLoadingOverlay();
            
            // Completely re-initialize the drag and drop functionality
            // This ensures all event listeners and state are properly reset
            initializeRackDragDrop();
            
            // Show a success message to the user
            showSuccessMessage('Component position updated successfully');
        }, 300);
    })
    .catch(error => {
        hideLoadingOverlay();
        showErrorMessage(error.message || 'Failed to update position');
        console.error('Error:', error);
    });
}

// Show loading overlay
function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    overlay.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div class="flex items-center">
                <svg class="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Updating component position...</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Hide loading overlay
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Show error message
function showErrorMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in';
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alert.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
            alert.remove();
        }, 500);
    }, 3000);
}

// Show success message
function showSuccessMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in';
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alert.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
            alert.remove();
        }, 500);
    }, 3000);
}

// Add a listener for Turbo navigation events to reinitialize on page changes
document.addEventListener('turbo:load', initializeRackDragDrop);

// Also listen for our custom event for after Turbo Stream updates
document.addEventListener('turbo-stream-render-complete', initializeRackDragDrop);
