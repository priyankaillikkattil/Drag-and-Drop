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
function deleteTableAndLines(table) {
   
    // Remove all lines related to this table
    const lines = connectionLines.querySelectorAll('line');
    lines.forEach(line => {
        const sourceRowId = line._sourceRow ? line._sourceRow.dataset.tableId : null;
        const targetRowId = line._targetRow ? line._targetRow.dataset.tableId : null;

        if (sourceRowId === table.id || targetRowId === table.id) {
            line.remove(); // Remove the line if it is associated with the deleted table
        }
    });

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
    if (line._sourceRow) {
        line._sourceRow.dataset.tableId = line._sourceRow.dataset.tableId;
    }
    if (line._targetRow) {
        line._targetRow.dataset.tableId = line._targetRow.dataset.tableId;
    }
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
        gridTable.className = 'grid-table';
        gridTable.dataset.tableId = tableData.id;
        gridTable.style.position = 'relative';
        gridTable.style.padding = '10px';
        gridTable.style.border = '1px solid #ccc';
        gridTable.style.borderRadius = '8px';
        gridTable.style.boxShadow = '0px 2px 6px rgba(0, 0, 0, 0.1)';
        gridTable.style.margin = '10px';
        gridTable.style.backgroundColor = '#fff';
        gridTable.style.height = '300px'; 
        gridTable.style.overflowY = 'auto';
        // Create a header container for title and close button
        const headerContainer = document.createElement('div');
        headerContainer.style.display = 'flex';
        headerContainer.style.justifyContent = 'space-between';
        headerContainer.style.alignItems = 'center';
        headerContainer.style.marginBottom = '10px';
    
        // Add table name
        const tableTitle = document.createElement('h3');
        tableTitle.textContent = tableData.name;
        tableTitle.style.margin = '0';
        tableTitle.style.fontSize = '18px';
        tableTitle.style.color = '#333';
        headerContainer.appendChild(tableTitle);
    
        // Add a close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '&times;'; // Unicode '×' for a better visual
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.background = 'transparent'; // Transparent background
        closeButton.style.color = '#333'; // Dark text color
        closeButton.style.border = '1px solid #333'; // Subtle border
        closeButton.style.borderRadius = '50%';
        closeButton.style.fontSize = '18px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.display = 'flex';
        closeButton.style.justifyContent = 'center';
        closeButton.style.alignItems = 'center';
        closeButton.style.transition = 'all 0.3s ease';
    
        // Hover effects
        closeButton.addEventListener('mouseover', () => {
            closeButton.style.color = 'white';
            closeButton.style.background = '#333';
        });
    
        closeButton.addEventListener('mouseout', () => {
            closeButton.style.color = '#333';
            closeButton.style.background = 'transparent';
        });
    
        // Close button functionality
        closeButton.addEventListener('click', () => {
             gridTable.remove(); // Remove the grid table from the DOM
             deleteTableAndLines(tableData);
        });
    
        headerContainer.appendChild(closeButton);
        gridTable.appendChild(headerContainer);
    
        // Add column name
        const columnTitle = document.createElement('p');
        columnTitle.textContent = `Column: ${columnData.name}`;
        columnTitle.style.margin = '0';
        gridTable.appendChild(columnTitle);

        
        // Check if columnData.details exists and create a table for it
        if (columnData.columns && Array.isArray(columnData.columns)) {
            const detailsTableDiv      = document.createElement('div');
            detailsTableDiv.className  = 'table-wrapper';
            detailsTableDiv.style.height = '140px';
            const detailsTable = document.createElement('table');
            detailsTable.style.width = '100%';
            detailsTable.className   = "draggable-table";
            detailsTable.style.borderCollapse = 'collapse';
    
            // Add a header row to the table
            const headerRow = document.createElement('tr');
            const headers = Object.keys(columnData.columns[0] || {});
            headers.forEach((header) => {
                const th = document.createElement('th');
                th.textContent = header;
                th.style.border = '1px solid #ddd';
                th.style.padding = '8px';
                th.style.backgroundColor = '#f2f2f2';
                th.style.textAlign = 'left';
               
                th.className ='resizable';
                headerRow.appendChild(th);
            });
            detailsTable.appendChild(headerRow);
    
            // Add data rows to the table
            columnData.columns.forEach((detail) => {
                const dataRow = document.createElement('tr');
                dataRow.draggable        = 'true';
                dataRow.className        = 'draggable-row';
                headers.forEach((header) => {
                    const td = document.createElement('td');
                    td.textContent = detail[header];
                    td.style.border = '1px solid #ddd';
                    td.style.padding = '8px';
                   
                    dataRow.appendChild(td);
                });
                detailsTable.appendChild(dataRow);
            });
            detailsTableDiv.appendChild(detailsTable);
            gridTable.appendChild(detailsTableDiv);
        } else {
            const noDetailsMessage = document.createElement('p');
            noDetailsMessage.textContent = 'No details available for this column.';
            gridTable.appendChild(noDetailsMessage);
        }
    
        // Add a resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.width = '10px';
        resizeHandle.style.height = '10px';
        resizeHandle.style.backgroundColor = 'blue';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.right = '0';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.cursor = 'se-resize';
    
        gridTable.appendChild(resizeHandle);
    
        // Enable resizing
        resizeHandle.addEventListener('mousedown', (e) => { console.log('ppp');
            e.preventDefault();
    
            const startWidth = gridTable.offsetWidth;
            const startHeight = gridTable.offsetHeight;
            const startX = e.clientX;
            const startY = e.clientY;
    
            function resize(e) {
                const newWidth = startWidth + (e.clientX - startX);
                const newHeight = startHeight + (e.clientY - startY);
                gridTable.style.width = `${newWidth}px`;
                gridTable.style.height = `${newHeight}px`;
            }
    
            function stopResize() {
                window.removeEventListener('mousemove', resize);
                window.removeEventListener('mouseup', stopResize);
            }
    
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResize);
        });
    
        // Enable dragging
        gridTable.style.position = 'absolute';
        gridTable.style.cursor = '';
    
        gridTable.addEventListener('mousedown', (e) => {
            // Check if the mouse is on a table column header (inside a 'th' element)
            const columnHeader = e.target.closest('td');

            if (columnHeader) {
                dragAndDropColumn();
                console.log(`Mouse is on column: ${columnHeader.textContent.trim()}`);
                return; // Exit to prevent dragging behavior when clicking on a column header
            }



            const isTitleArea = e.target.closest('th') || e.target === tableTitle;
        
            if (!isTitleArea || e.target === resizeHandle || e.target === closeButton) return;
        
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const startLeft = parseInt(window.getComputedStyle(gridTable).left, 10) || 0;
            const startTop = parseInt(window.getComputedStyle(gridTable).top, 10) || 0;
        
            function drag(e) {
                const newLeft = startLeft + (e.clientX - startX);
                const newTop = startTop + (e.clientY - startY);
                gridTable.style.left = `${newLeft}px`;
                gridTable.style.top = `${newTop}px`;
            }
        
            function stopDrag() {
                window.removeEventListener('mousemove', drag);
                window.removeEventListener('mouseup', stopDrag);
            }
        
            window.addEventListener('mousemove', drag);
            window.addEventListener('mouseup', stopDrag);
        });
        
    
        return gridTable;
    }
    


    
    
    

    function dragElement(event, element) {
        event.preventDefault();
    
        let offsetX = event.clientX - element.offsetLeft;
        let offsetY = event.clientY - element.offsetTop;
    
        function onMouseMove(e) {
            element.style.position = 'absolute'; // Ensure the element is positioned absolutely
            element.style.zIndex = '1000'; // Bring the element to the front
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        }
    
        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    

  })
  .catch(error => console.error('Error fetching the tables data:', error));


  