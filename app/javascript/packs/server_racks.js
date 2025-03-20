document.addEventListener('DOMContentLoaded', () => {
    const serverRack = document.querySelector('div#server-rack-vizualization');
    let draggedItem = null;
    
    serverRack.addEventListener('dragstart', (event) => {
        draggedItem = event.target;
        event.dataTransfer.setData('text/html', draggedItem.innerHTML);
        event.dataTransfer.setData('text/class', draggedItem.className);
    });

    serverRack.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    serverRack.addEventListener('drop', (event) => {
        if (event.target.classList.contains('draggable')) {
            const tempHTML = draggedItem.innerHTML;
            const tempClass = draggedItem.className;

            draggedItem.innerHTML = event.target.innerHTML;
            draggedItem.className = event.target.className;

            event.target.innerHTML = tempHTML;
            event.target.className = tempClass;
        }
    });
});
