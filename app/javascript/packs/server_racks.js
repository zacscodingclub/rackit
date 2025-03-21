// Function to ensure we run the initialization once the DOM is ready
function ensureDragDropInitialized() {
    console.log("Ensuring drag and drop is initialized...");
    
    // Wait just a moment to ensure the DOM is settled - solves race conditions
    setTimeout(function() {
        // Start fresh every time
        resetDragDropState();
        initializeRackDragDrop();
    }, 100);
}

// Add event listeners for all possible Turbo and DOM events
document.addEventListener('DOMContentLoaded', ensureDragDropInitialized);
document.addEventListener('turbo:load', ensureDragDropInitialized);
document.addEventListener('turbo:frame-load', ensureDragDropInitialized);
document.addEventListener('turbo:render', ensureDragDropInitialized);

// Run immediately as well, for good measure
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    ensureDragDropInitialized();
}

// Make these variables global to the module scope
let rackVisualization = null;
let rackId = null;
let csrfToken = null;
let draggedComponent = null;
let originalPosition = null;
let componentHeight = 0;
let rackPositions = [];
let currentDropTargetPosition = null;
let isInitialized = false;
let dragDropEnabled = true; // Use this to prevent operations during updates

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
    
    try {
        // Get rack ID from data attribute first (more reliable)
        const rackElement = document.querySelector('[data-rack-id]');
        if (rackElement) {
            rackId = rackElement.dataset.rackId;
            console.log(`Rack ID from data attribute: ${rackId}`);
        } else {
            // Fallback to URL if data attribute not available
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            if (pathParts.length >= 2 && pathParts[0] === 'racks') {
                rackId = pathParts[1];
                console.log(`Rack ID from URL: ${rackId}`);
            } else {
                console.warn("Could not determine rack ID from data attribute or URL");
                return; // Exit if we can't find a rack ID
            }
        }
        
        // Get CSRF token
        const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
        if (csrfTokenElement) {
            csrfToken = csrfTokenElement.getAttribute('content');
        } else {
            console.error("CSRF token not found");
            return; // Exit if no CSRF token is found
        }
        
        // Reset state
        draggedComponent = null;
        originalPosition = null;
        currentDropTargetPosition = null;
        
        // Remove any existing drop zones to clean up
        document.querySelectorAll('.drop-zone').forEach(zone => zone.remove());
        
        // Initialize the rack positions
        initRackPositions();
        
        // Setup draggable components
        setupDraggableComponents();
        
        // Mark as initialized
        isInitialized = true;
        
        console.log("Rack drag and drop initialization complete");
    } catch (error) {
        console.error("Error initializing rack drag and drop:", error);
    }
}
    
    // Initialize rack positions array with all available U positions
function initRackPositions() {
    console.log("Initializing rack positions");
    
    if (!rackVisualization) {
        console.error("Rack visualization element not found");
        return;
    }
    
    const rackHeight = parseInt(rackVisualization.style.height) / 40;
    console.log(`Rack height: ${rackHeight} units`);
    
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
    const components = document.querySelectorAll('.component');
    console.log(`Found ${components.length} components to process`);
    
    components.forEach(comp => {
        const position = parseInt(comp.dataset.position);
        const height = parseInt(comp.dataset.componentHeight);
        const compId = comp.dataset.componentId;
        
        console.log(`Component ${compId} at position ${position} with height ${height}`);
        
        // Mark all positions this component occupies
        for (let i = position; i < position + height; i++) {
            const index = i - 1; // Convert to 0-based index
            if (index < rackPositions.length) {
                rackPositions[index].occupied = true;
                rackPositions[index].componentId = compId;
            }
        }
    });
}

// Handle drag start event
function handleDragStart(e) {
    // Stop if drag/drop is disabled during updates
    if (!dragDropEnabled) {
        console.warn("Drag operation prevented - system is currently updating");
        e.preventDefault();
        return false;
    }
    
    console.log("Drag start event triggered on component", this.dataset.componentId);
    console.log("Component details:", {
        id: this.dataset.componentId,
        name: this.dataset.componentName,
        height: this.dataset.componentHeight,
        position: this.dataset.position,
        draggable: this.draggable,
        hasAttribute: this.hasAttribute('draggable')
    });
    
    // Set global state
    draggedComponent = this;
    componentHeight = parseInt(this.dataset.componentHeight) || 1;
    originalPosition = parseInt(this.dataset.position) || 1;
    
    // Log the drag operation
    console.log(`Starting drag of component ${this.dataset.componentId} (${this.dataset.componentName}) from position ${originalPosition}`);
    
    // Add visual cue for dragging
    this.classList.add('opacity-50');
    
    try {
        // Store component data in dataTransfer
        const data = {
            componentId: this.dataset.componentId,
            height: componentHeight,
            position: originalPosition,
            name: this.dataset.componentName || ''
        };
        
        // Set multiple formats for better browser compatibility
        e.dataTransfer.setData('text/plain', `Component:${data.componentId}:${data.position}`);
        
        try {
            // Try to set JSON data - this can fail in some browsers
            e.dataTransfer.setData('application/json', JSON.stringify(data));
        } catch (jsonError) {
            console.warn("Could not set JSON data format:", jsonError);
            // Continue anyway - we have the text format as backup
        }
        
        // Set allowed drag effect
        e.dataTransfer.effectAllowed = 'move';
        
        // Set a drag image to improve visual feedback
        // Use the component itself as the drag image
        try {
            // Calculate center point for drag image
            const rect = this.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            e.dataTransfer.setDragImage(this, centerX, centerY);
        } catch (imgError) {
            console.warn("Could not set drag image:", imgError);
            // Continue anyway - browser will use default drag image
        }
        
        // Show all drop zones
        showDropZones();
        
        // Prevent event handling on parent elements
        e.stopPropagation();
        
        return true;
    } catch (error) {
        console.error("Error in drag start handler:", error);
        
        // Attempt recovery by resetting state
        draggedComponent = null;
        hideDropZones();
        this.classList.remove('opacity-50');
        
        // Show error message
        showErrorMessage("Drag operation failed to initialize");
        
        return false;
    }
}

// Handle drag end event
function handleDragEnd(e) {
    console.log("Drag end event triggered on component", this.dataset.componentId);
    
    // Clear visual cue
    this.classList.remove('opacity-50');
    
    // Clean up the UI
    hideDropZones();
    
    // Reset global state
    const wasDragging = draggedComponent !== null;
    draggedComponent = null;
    
    // Refresh positions after drag operation
    initRackPositions();
    
    // If the drag was cancelled without a drop, ensure UI is back to normal
    if (wasDragging && currentDropTargetPosition === null) {
        console.log("Drag was cancelled without drop, ensuring clean state");
        
        // Force complete rebuild of draggable elements
        setTimeout(() => {
            setupDraggableComponents();
        }, 50);
    }
    
    // Reset drop target position
    currentDropTargetPosition = null;
}

// Setup draggable components
function setupDraggableComponents() {
    // Force get a fresh list of components every time
    const components = document.querySelectorAll('.component[draggable="true"]');
    
    console.log(`Setting up ${components.length} draggable components`);
    
    // Completely remove all listeners on all components first
    document.querySelectorAll('.component').forEach(comp => {
        // Clone and replace each component to eliminate all listeners
        const clone = comp.cloneNode(true);
        if (comp.parentNode) {
            comp.parentNode.replaceChild(clone, comp);
        }
    });
    
    // Now get a fresh list after replacing the nodes
    const freshComponents = document.querySelectorAll('.component[draggable="true"]');
    
    // Add event listeners to the fresh components
    freshComponents.forEach(component => {
        // Add new listeners to the cloned elements
        component.addEventListener('dragstart', handleDragStart);
        component.addEventListener('dragend', handleDragEnd);
        
        // Set cursor style to indicate draggability
        component.style.cursor = 'grab';
        
        // Log setup for debugging
        console.log(`Setup component: ${component.dataset.componentName || 'unnamed'} (ID: ${component.dataset.componentId}) at position ${component.dataset.position}`);
    });
    
    // If no draggable components were found, log a message
    if (freshComponents.length === 0) {
        console.warn("No draggable components found! Check HTML structure and draggable attributes.");
    }
}

// Show drop zones during drag
function showDropZones() {
    hideDropZones(); // Clear any existing drop zones first
    
    // Show the trash bin when dragging
    const trashBin = document.getElementById('trash-bin');
    if (trashBin) {
        trashBin.classList.remove('hidden');
        trashBin.classList.add('flex', 'animate-pulse');
        
        // Setup trash bin drop event handlers
        trashBin.addEventListener('dragover', handleTrashDragOver);
        trashBin.addEventListener('dragleave', handleTrashDragLeave);
        trashBin.addEventListener('drop', handleTrashDrop);
    }
    
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
    const componentId = draggedComponent.dataset.componentId;
    
    console.log(`Dropping component ${componentId} at position ${newPosition} (from ${originalPosition})`);
    
    // Don't do anything if dropping back to the original position
    if (newPosition === originalPosition) {
        console.log('Same position, ignoring drop');
        hideDropZones();
        return;
    }
    
    // Store information about the component being moved
    const componentData = {
        id: componentId,
        height: componentHeight,
        oldPosition: originalPosition,
        newPosition: newPosition
    };
    
    // Hide all drop zones immediately to prevent multiple drops
    hideDropZones();
    
    // Clear dragged component reference to prevent further drops
    const savedComponent = draggedComponent;
    draggedComponent = null;
    
    // Add visual feedback before the AJAX call
    savedComponent.classList.add('opacity-50');
    
    // Update component position through AJAX call
    updateComponentPosition(componentData.id, componentData.newPosition);
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
    
    // Hide and reset the trash bin
    const trashBin = document.getElementById('trash-bin');
    if (trashBin) {
        trashBin.classList.add('hidden');
        trashBin.classList.remove('flex', 'animate-pulse', 'bg-red-100', 'border-red-500', 'text-red-500');
        trashBin.classList.add('bg-gray-100', 'dark:bg-gray-700', 'border-gray-300', 'dark:border-gray-600', 'text-gray-500', 'dark:text-gray-400');
        
        // Remove event listeners
        trashBin.removeEventListener('dragover', handleTrashDragOver);
        trashBin.removeEventListener('dragleave', handleTrashDragLeave);
        trashBin.removeEventListener('drop', handleTrashDrop);
    }
}

// Update component position via Turbo Streams
function updateComponentPosition(componentId, newPosition) {
    // Disable drag/drop during update operation
    dragDropEnabled = false;
    
    // Find the rack visualization and fade it out slightly for smoother transition
    const rackViz = document.getElementById('server-rack-vizualization');
    if (rackViz) {
        rackViz.style.opacity = '0.7';
    }
    
    // Show loading overlay with a message about what we're doing
    showLoadingOverlay('Moving component to position ' + newPosition + '...');
    
    console.log(`Updating component ${componentId} to position ${newPosition}`);
    
    // Reset state to avoid any lingering references
    draggedComponent = null;
    originalPosition = null;
    
    // Make sure we have the rack ID
    if (!rackId) {
        console.error("Missing rack ID, can't update component");
        hideLoadingOverlay();
        showErrorMessage("Error: Could not determine the server rack ID");
        dragDropEnabled = true; // Re-enable drag/drop
        return;
    }
    
    // Make sure we have the CSRF token
    if (!csrfToken) {
        console.error("Missing CSRF token, can't update component");
        hideLoadingOverlay();
        showErrorMessage("Error: Missing security token (CSRF)");
        dragDropEnabled = true; // Re-enable drag/drop
        return;
    }
    
    // Send AJAX request with Turbo Stream format
    fetch(`/racks/${rackId}/rack_components/${componentId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'Accept': 'text/vnd.turbo-stream.html, text/html, application/json'
        },
        body: JSON.stringify({
            position_y: newPosition
        })
    })
    .then(response => {
        if (!response.ok) {
            // Get more detailed error info if available
            if (response.headers.get('Content-Type')?.includes('application/json')) {
                return response.json().then(data => {
                    throw new Error(data.error || `Failed with status: ${response.status}`);
                });
            }
            throw new Error(`Failed to update position (Status: ${response.status})`);
        }
        
        // Check content type to determine how to handle the response
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
                return { type: 'json', data };
            });
        } else {
            return response.text().then(text => {
                return { type: 'html', data: text };
            });
        }
    })
    .then(result => {
        if (result.type === 'json') {
            // Handle JSON response
            console.log('Received JSON response:', result.data);
            // Reload the page as a fallback for JSON responses
            showSuccessMessage('Component position updated');
            setTimeout(() => {
                window.location.reload();
            }, 500);
            return;
        }
        
        const html = result.data;
        
        // Process Turbo Stream response manually to ensure it works
        if (html && html.includes('turbo-stream')) {
            console.log('Processing Turbo Stream response');
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const streams = doc.querySelectorAll('turbo-stream');
            
            if (streams.length === 0) {
                console.warn('No turbo-stream elements found in response');
            }
            
            streams.forEach(stream => {
                const action = stream.getAttribute('action');
                const target = stream.getAttribute('target');
                const template = stream.querySelector('template');
                
                console.log(`Turbo Stream: ${action} -> ${target}`);
                
                if (action && target && template) {
                    const content = template.content.cloneNode(true);
                    const targetElement = document.getElementById(target);
                    
                    if (targetElement) {
                        if (action === 'replace') {
                            console.log(`Replacing content in #${target}`);
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
                            console.log(`Appending content to #${target}`);
                            targetElement.appendChild(content);
                        } else if (action === 'prepend') {
                            console.log(`Prepending content to #${target}`);
                            targetElement.prepend(content);
                        } else if (action === 'remove') {
                            console.log(`Removing #${target}`);
                            targetElement.remove();
                        }
                    } else {
                        console.warn(`Target element #${target} not found in the DOM`);
                    }
                } else {
                    console.warn(`Invalid turbo-stream element: missing action, target, or template`);
                }
            });
            
            // Ensure draggedComponent is null before re-initialization
            draggedComponent = null;
            originalPosition = null;
            
            // Register a custom event to observe Turbo Stream updates
            // This event will be fired after Turbo processes all streams
            document.dispatchEvent(new CustomEvent('turbo-stream-render-complete'));
            
            // Important: Reset all relevant state after turbo update
            setTimeout(() => {
                rackVisualization = document.getElementById('server-front');
                
                // Force complete re-setup of all drag-drop functionality
                if (rackVisualization) {
                    console.log("Force re-setup of all draggable components after Turbo Stream update");
                    setupDraggableComponents();
                }
            }, 100);
        } else {
            console.warn('Response does not contain turbo-stream elements, reloading page');
            // If not a turbo stream response, reload the page as fallback
            showSuccessMessage('Component position updated');
            setTimeout(() => {
                window.location.reload();
            }, 500);
            return;
        }
        
        // Hide the loading overlay after processing the response
        setTimeout(() => {
            hideLoadingOverlay();
            
            // Completely re-initialize the drag and drop functionality
            // This ensures all event listeners and state are properly reset
            initializeRackDragDrop();
            
            // Explicitly force setupDraggableComponents again
            setTimeout(() => {
                setupDraggableComponents();
            }, 200);
            
            // Show a success message to the user
            showSuccessMessage('Component position updated successfully');
        }, 300);
    })
    .catch(error => {
        console.error('Error updating component position:', error);
        hideLoadingOverlay();
        
        // Restore opacity if needed
        if (rackViz) {
            rackViz.style.opacity = '1';
        }
        
        // Show error message to the user
        showErrorMessage(error.message || 'Failed to update position');
        
        // Reset all state variables
        draggedComponent = null;
        originalPosition = null;
        
        // Reinitialize drag and drop to reset the UI state
        setTimeout(() => {
            initializeRackDragDrop();
            
            // Re-enable drag/drop operations
            dragDropEnabled = true;
            console.log("Re-enabled drag/drop operations after error recovery");
        }, 300);
    })
    .finally(() => {
        // Ensure drag/drop is re-enabled no matter what happened
        setTimeout(() => {
            if (!dragDropEnabled) {
                dragDropEnabled = true;
                console.log("Re-enabled drag/drop operations via finally handler");
            }
        }, 1000); // Give it extra time in case other processes are running
    });
}

// Show loading overlay
function showLoadingOverlay(message = 'Updating component position...') {
    // First, remove any existing overlay
    hideLoadingOverlay();
    
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
                <span>${message}</span>
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

// Function to completely reset the drag and drop state
function resetDragDropState() {
    console.log("Completely resetting drag and drop state");
    
    // Reset all state variables
    draggedComponent = null;
    originalPosition = null;
    componentHeight = 0;
    currentDropTargetPosition = null;
    
    // Clean up the UI
    hideDropZones();
    
    // Remove any drag-related classes from components
    document.querySelectorAll('.component').forEach(comp => {
        comp.classList.remove('opacity-50');
    });
    
    // Get fresh references to rack visualization
    rackVisualization = document.getElementById('server-front');
    
    if (rackVisualization) {
        // Make sure all components are draggable for rack owner
        document.querySelectorAll('.component[draggable="true"]').forEach(comp => {
            // Clear any inline styles that might be interfering
            comp.style.cursor = 'grab';
        });
    }
}

// Listen for Turbo Stream events that might contain server rack updates
document.addEventListener('turbo:before-stream-render', (event) => {
    if (event.target && event.target.action === "replace" && 
        event.target.target === "server-rack-vizualization") {
        console.log("Server rack visualization is being replaced");
        // Clean up any existing drag/drop state before replacement
        resetDragDropState();
    }
});

// Listen for Turbo Stream update completion
document.addEventListener('turbo:stream-render', (event) => {
    console.log("Turbo Stream render event:", event);
    
    // Schedule initialization after Turbo Stream rendering completes
    // Use setTimeout to ensure the DOM has been updated
    setTimeout(() => {
        if (event.target) {
            if (event.target.target === "server-rack-vizualization") {
                console.log("Server rack visualization was updated, reinitializing drag and drop");
                resetDragDropState();
                initializeRackDragDrop();
                
                // Double-check component setup after a small delay
                setTimeout(() => {
                    setupDraggableComponents();
                }, 200);
            } else if (event.target.target === "rack-components-list") {
                console.log("Rack components list was updated");
                // Refresh rack positions in case components changed
                if (isInitialized && rackVisualization) {
                    initRackPositions();
                }
            }
        }
    }, 100); // Small delay to ensure DOM updates are complete
});

// Also listen for our custom event for after manual Turbo Stream updates
document.addEventListener('turbo-stream-render-complete', () => {
    console.log("Custom turbo-stream-render-complete event received");
    
    // Completely reset everything
    resetDragDropState();
    
    // Set a sequence of initialization steps with appropriate delays
    setTimeout(() => {
        // Step 1: Basic initialization
        initializeRackDragDrop();
        
        // Step 2: Force setup components
        setTimeout(() => {
            setupDraggableComponents();
            
            // Step 3: Final cleanup and enable
            setTimeout(() => {
                // Re-enable drag/drop
                dragDropEnabled = true;
                console.log("Drag/drop re-enabled after turbo-stream-render-complete");
                
                // Force one last setup to ensure everything is ready
                setupDraggableComponents();
            }, 150);
        }, 150);
    }, 150);
});

// Trash bin event handlers
function handleTrashDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Visual feedback for trash bin hover
    this.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'border-gray-300', 'dark:border-gray-600', 'text-gray-500', 'animate-pulse');
    this.classList.add('bg-red-100', 'border-red-500', 'text-red-500', 'scale-110');
    
    // Update the text and icon
    this.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span class="font-bold">Release to Delete!</span>
    `;
}

function handleTrashDragLeave(e) {
    // Reset trash bin appearance
    this.classList.add('bg-gray-100', 'dark:bg-gray-700', 'border-gray-300', 'dark:border-gray-600', 'text-gray-500', 'animate-pulse');
    this.classList.remove('bg-red-100', 'border-red-500', 'text-red-500', 'scale-110');
    
    // Reset text and icon
    this.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Drop to Delete</span>
    `;
}

function handleTrashDrop(e) {
    e.preventDefault();
    
    if (!draggedComponent) {
        console.error('No dragged component found when drop occurred');
        return;
    }
    
    const componentId = draggedComponent.dataset.componentId;
    const componentName = draggedComponent.dataset.componentName;
    
    // Show confirmation dialog
    if (confirm(`Are you sure you want to delete "${componentName}" from this rack?`)) {
        // Delete the component - send DELETE request
        deleteComponent(componentId);
    } else {
        // If canceled, just hide drop zones and reset
        hideDropZones();
    }
}

// Delete component via AJAX
function deleteComponent(componentId) {
    // Show loading overlay
    showLoadingOverlay();
    
    console.log(`Deleting component ${componentId}`);
    
    // Send DELETE request
    fetch(`/racks/${rackId}/rack_components/${componentId}`, {
        method: 'DELETE',
        headers: {
            'X-CSRF-Token': csrfToken,
            'Accept': 'text/vnd.turbo-stream.html, application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete component');
        }
        return response.text();
    })
    .then(html => {
        // Process Turbo Stream response
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
                            targetElement.innerHTML = '';
                            targetElement.appendChild(content);
                        } else if (action === 'remove') {
                            targetElement.remove();
                        } else if (action === 'append') {
                            targetElement.appendChild(content);
                        } else if (action === 'prepend') {
                            targetElement.prepend(content);
                        }
                    }
                }
            });
            
            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('turbo-stream-render-complete'));
        } else {
            // If not a turbo stream response, reload the page as fallback
            window.location.reload();
            return;
        }
        
        // Hide the loading overlay
        setTimeout(() => {
            hideLoadingOverlay();
            
            // Reinitialize drag and drop
            initializeRackDragDrop();
            
            // Show success message
            showSuccessMessage('Component removed from rack successfully');
        }, 300);
    })
    .catch(error => {
        hideLoadingOverlay();
        showErrorMessage(error.message || 'Failed to delete component');
        console.error('Error:', error);
    });
}
