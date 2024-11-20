const tableList = document.getElementById('table-list');
const gridArea = document.getElementById('grid-area');
const connectionLines = document.getElementById('connection-lines');
let dragSource = null;
let currentLine = null;
// Mouse move handler (global)
function onMouseMove(event) {
    if (dragSource && currentLine) {
        const mouseX = event.clientX + window.scrollX;
        const mouseY = event.clientY + window.scrollY;

        const isVertical = Math.abs(mouseY - dragSource.offsetTop) > Math.abs(mouseX - dragSource.offsetLeft);
        updateArrowLine(currentLine, dragSource.offsetLeft, dragSource.offsetTop, mouseX, mouseY, isVertical);
    }
}

// Mouse up handler (global)
function onMouseUp(event) {
    if (dragSource && currentLine) {
        const endPosition = getRowCenterPosition(dragSource);
        console.log("Drag end position: ", endPosition);

        if (currentLine._sourceRow) {
            updateArrowLine(currentLine, currentLine.getAttribute('x1'), currentLine.getAttribute('y1'), endPosition.x, endPosition.y, false);
        }

        // Clean up after the drag ends
        dragSource = null;
        currentLine = null;

        // Remove the global listeners once drag is complete
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}
// Create an arrow line between two points
function createArrowLine(x1, y1, x2, y2) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    connectionLines.appendChild(line);
    return line;
}

// Update the arrow line based on new positions
function updateArrowLine(line, x1, y1, x2, y2, isVertical) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const arrowLength = Math.min(distance - 10, distance); // Avoid overshooting
    const angle = isVertical ? Math.PI / 2 : Math.atan2(dy, dx);

    const adjustedX2 = x1 + arrowLength * Math.cos(angle);
    const adjustedY2 = y1 + arrowLength * Math.sin(angle);

    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', adjustedX2);
    line.setAttribute('y2', adjustedY2);
}

// Get the center position of a row element
function getRowCenterPosition(row) {
    const rect = row.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + rect.height / 2 + window.scrollY
    };
}

// Initialize drag and drop functionality for rows
function dragAndDropColumn() {
    console.log('Drag and Drop Initialized');
    const draggableRows = document.querySelectorAll('.draggable-row');
    
    if (draggableRows.length > 0) {
        draggableRows.forEach(row => {
            row.addEventListener('mousedown', (event) => {
                // When mouse is pressed, set dragging source and create line
                dragSource = event.target;
                const startPosition = getRowCenterPosition(dragSource);
                console.log("Drag start position: ", startPosition);

                currentLine = createArrowLine(startPosition.x, startPosition.y, startPosition.x, startPosition.y);
                
                // Attach mousemove and mouseup listeners globally
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    } else {
        console.log('No .draggable-row elements found.');
    }
}

// Handle drop behavior
document.querySelectorAll('.droppable-row').forEach(row => {
    row.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    row.addEventListener('drop', (event) => {
        event.preventDefault();
        const targetRow = event.target.closest('.droppable-row');

        if (targetRow && targetRow !== dragSource) {
            const sourcePosition = getRowCenterPosition(dragSource);
            const targetPosition = getRowCenterPosition(targetRow);
            updateArrowLine(currentLine, sourcePosition.x, sourcePosition.y, targetPosition.x, targetPosition.y);

            currentLine._sourceRow = dragSource;
            currentLine._targetRow = targetRow;
        }
    });
});

// Update line position on scroll
document.querySelectorAll('.table-wrapper').forEach(wrapper => {
    wrapper.addEventListener('scroll', () => {
        const lines = connectionLines.querySelectorAll('line');
        lines.forEach(line => {
            if (line._sourceRow && line._targetRow) {
                const sourcePosition = getRowCenterPosition(line._sourceRow);
                const targetPosition = getRowCenterPosition(line._targetRow);
                updateArrowLine(line, sourcePosition.x, sourcePosition.y, targetPosition.x, targetPosition.y);
            }
        });
    });
});

// Fetch table data from the JSON file
fetch('tables.json')
  .then(response => response.json())
  .then(data => {
    const tables = [...data["table 1"], ...data["table 2"], ...data["table 3"]]; // Combine tables from all sources

    // Populate table list with expandable cards
    tables.forEach(table => {
      const tableCard = createTableCard(table);
      tableList.appendChild(tableCard);
    });

    // Function to create table card with columns
    function createTableCard(table) {
      const tableCard = document.createElement('div');
      tableCard.className = 'card';
      
      const tableTitle = document.createElement('h3');
      tableTitle.textContent = table.name;
      
      const toggleIcon = document.createElement('span');
      toggleIcon.textContent = ' + ';
      toggleIcon.className = 'toggle-icon';
      tableTitle.appendChild(toggleIcon);
      
      const columnsList = document.createElement('ul');
      
      table.columns.forEach(column => {
        const columnItem = document.createElement('li');
        columnItem.textContent = `${column.name}`;
        columnItem.draggable = true;
        columnItem.dataset.columnId = column.column_id;
        columnItem.dataset.tableId = table.id;
        columnItem.classList.add('draggable-column');
        columnsList.appendChild(columnItem);
      });

      tableCard.appendChild(tableTitle);
      tableCard.appendChild(columnsList);

      // Toggle columns visibility when clicking the table title
      toggleIcon.addEventListener('click', () => {
        if (columnsList.style.display === 'none') {
          columnsList.style.display = 'block';
          toggleIcon.textContent = ' - ';
        } else {
          columnsList.style.display = 'none';
          toggleIcon.textContent = ' + ';
        }
      });

      // Drag and drop functionality for columns
      tableCard.addEventListener('dragstart', (e) => {
        console.log('Drag started:', tableCard.textContent);
        
        e.dataTransfer.setData('column-id', e.target.dataset.columnId);
        e.dataTransfer.setData('table-id', e.target.dataset.tableId);
      });

      return tableCard;
    }

    // Drag and drop functionality for grid area
    gridArea.addEventListener('dragover', (e) => e.preventDefault());

    gridArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const columnId = e.dataTransfer.getData('column-id');
        const tableId = e.dataTransfer.getData('table-id');
      
        // Check if the table and column combination already exists in the grid
        const existingGridElement = gridArea.querySelector(
          `[data-table-id="${tableId}"][data-column-id="${columnId}"]`
        );
      
        if (existingGridElement) {
          // Highlight the existing grid element
          existingGridElement.style.border = '2px solid red';
          setTimeout(() => {
            existingGridElement.style.border = ''; // Reset border after a short delay
          }, 2000);
      
          // Optionally show an alert
          alert('This table and column combination already exists in the grid!');
          return;
        }
      
        // Proceed to add the new grid element
        const tableData = tables.find(t => t.id === tableId);
        if (!tableData) {
            return; 
          }

        const columnData = tableData.columns.find(col => col.column_id === columnId);
        if (columnData) {
                const gridTable = createGridTable(tableData, columnData);
                gridTable.dataset.columnId = columnId; // Add columnId for future checks
                gridTable.style.left = `${e.offsetX}px`;
                gridTable.style.top = `${e.offsetY}px`;
                gridArea.appendChild(gridTable);
            }
    });

    function createGridTable(tableData, columnData) {
        const gridTable = document.createElement('div');
        gridTable.classList.add('grid-table');
        gridTable.classList.add('draggable');
        gridTable.setAttribute('draggable', true);
      
        const gridTableTitle = document.createElement('h4');
        gridTableTitle.textContent = `${tableData.name} - ${columnData.name}`;
      
        gridTable.appendChild(gridTableTitle);
      
        return gridTable;
    }
  })
  .catch(error => console.error('Error loading table data:', error));
