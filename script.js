const connectionLines = document.getElementById('connection-lines');
const gridArea = document.getElementById('grid-area');
const tableList = document.getElementById('table-list');


let isDrawing = false;
let currentLine = null;
let startPoint = null;
let selectedElement = null;
connectionLines.addEventListener('mousedown', startDrawing);
connectionLines.addEventListener('mousemove', drawLine);
connectionLines.addEventListener('mouseup', finishDrawing);

function startDrawing(event) {
    const startX = event.offsetX;
    const startY = event.offsetY;

    const nearestTable = findNearestTable(startX, startY);
    if (!nearestTable) {
        alert("You must start drawing near a table!");
        return;
    }

    startPoint = createPoint(startX, startY);
    connectionLines.appendChild(startPoint);

    currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    currentLine.setAttribute('x1', startX);
    currentLine.setAttribute('y1', startY);
    currentLine.setAttribute('x2', startX);
    currentLine.setAttribute('y2', startY);
    currentLine.setAttribute('stroke', '#000');
    currentLine.setAttribute('stroke-width', 2);
    currentLine.setAttribute('marker-end', 'url(#arrowhead)');
    connectionLines.appendChild(currentLine);

    isDrawing = true;
}

function drawLine(event) {
    if (!isDrawing || !currentLine) return;

    const endX = event.offsetX;
    const endY = event.offsetY;

    currentLine.setAttribute('x2', endX);
    currentLine.setAttribute('y2', endY);
}

function finishDrawing(event) {
    if (!isDrawing) return;

    const endX = event.offsetX;
    const endY = event.offsetY;

    // Find the nearest table to the end coordinates
    const endNearestTable = findNearestTable(endX, endY);
    if (!endNearestTable) {
        alert("You must end drawing near a table!");
        connectionLines.removeChild(currentLine); // Remove the line if drawing is invalid
        currentLine = null;
        isDrawing = false;
        return;
    }

    // Find the nearest table to the start coordinates
    const rect = startPoint.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const startNearestTable = findNearestTable(startX, startY);
    if (!startNearestTable) {
        alert("You must start drawing near a table!");
        connectionLines.removeChild(currentLine);
        currentLine = null;
        isDrawing = false;
        return;
    }

    // Create the end point
    const endPoint = createPoint(endX, endY);
    connectionLines.appendChild(endPoint);

    // Set dataset for the line
    currentLine.dataset.start = startPoint.id;
    currentLine.dataset.end = endPoint.id;
    currentLine.dataset.end = endPoint.id;
    currentLine.dataset.end = endPoint.id;
    // Assign table IDs as the line's class name
    const startTableId = startNearestTable.dataset.columnId;
    const endTableId = endNearestTable.dataset.columnId;
    className = `${startTableId} ${endTableId}`;
    currentLine.classList.add(`col_${startTableId}`, `col_${endTableId}`);

    // Reset drawing state
    isDrawing = false;
    currentLine = null;
}


function createPoint(x, y) {
    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    point.setAttribute('cx', x);
    point.setAttribute('cy', y);
    point.setAttribute('r', 5);
    point.setAttribute('id', `point-${Date.now()}`);
    return point;
}


    function findNearestTable(x, y) {
        const tables = document.querySelectorAll('.grid-table');
        let nearestTable = null;
        let minDistance = Infinity;
        const threshold = 500; // Maximum distance to consider a table
        let nearbyTables = 0; // Count of tables within threshold
        let hasCloseTable = false; // Flag for any table within closeThreshold
    
        tables.forEach((table) => {
            const rect = table.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
    
            const distance = Math.sqrt(Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2));
    
            // Check if table is within the threshold
            if (distance < threshold) {
                nearbyTables++;
                    hasCloseTable = true;
                
    
                // Find the nearest table
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestTable = table;
                }
            }
        });
    
        
    
        // Ensure the conditions are met
        if (nearbyTables >= 1 && hasCloseTable && tables.length>1) {
            return nearestTable;
        } else {
            console.warn('Conditions not met: At least two tables within threshold and one close table required.');
            return null;
        }
    }
    


    connectionLines.addEventListener('mousemove', (event) => {
      if (!selectedElement) return;

      const x = event.offsetX;
      const y = event.offsetY;

      selectedElement.setAttribute('cx', x);
      selectedElement.setAttribute('cy', y);

      // Update connected lines
      Array.from(connectionLines.querySelectorAll('line')).forEach((line) => {
        if (line.dataset.start === selectedElement.id) {
          line.setAttribute('x1', x);
          line.setAttribute('y1', y);
        }
        if (line.dataset.end === selectedElement.id) {
          line.setAttribute('x2', x);
          line.setAttribute('y2', y);
        }
      });
    });

    connectionLines.addEventListener('mouseup', () => (selectedElement = null));
// Mouse move handler (global)
function onMouseMove(event) { 
    if (dragSource && currentLine) {
        const mouseX = event.clientX + window.scrollX;
        const mouseY = event.clientY + window.scrollY;

        const isVertical = Math.abs(mouseY - dragSource.offsetTop) > Math.abs(mouseX - dragSource.offsetLeft);
        updateArrowLine(currentLine, dragSource.offsetLeft, dragSource.offsetTop, mouseX, mouseY, isVertical);
    }
}

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
        const gridTable                     = document.createElement('div');
        gridTable.className                 = 'grid-table';
        gridTable.dataset.tableId           = tableData.id;
        gridTable.style.position            = 'relative';
        gridTable.style.padding             = '10px';
        gridTable.style.border              = '1px solid #ccc';
        gridTable.style.borderRadius        = '8px';
        gridTable.style.boxShadow           = '0px 2px 6px rgba(0, 0, 0, 0.1)';
        gridTable.style.margin              = '10px';
        gridTable.style.backgroundColor     = '#fff';
        gridTable.style.height              = '300px'; 
        gridTable.style.overflowY           = 'auto';

        // Create a header container for title and close button
        const headerContainer               = document.createElement('div');
        headerContainer.style.display       = 'flex';
        headerContainer.style.justifyContent= 'space-between';
        headerContainer.style.alignItems    = 'center';
        headerContainer.style.marginBottom  = '10px';
    
        // Add table name
        const tableTitle                = document.createElement('h3');
        tableTitle.textContent          = tableData.name;
        tableTitle.style.margin         = '0';
        tableTitle.style.fontSize       = '18px';
        tableTitle.style.color          = '#333';
        headerContainer.appendChild(tableTitle);
    
        // Add a close button
        const closeButton           = document.createElement('button');
        closeButton.className       = 'close-button';
        closeButton.innerHTML       = '&times;'; // Unicode '×' for a better visual
        closeButton.style.width     = '30px';
        closeButton.style.height    = '30px';
        closeButton.style.background= 'transparent'; // Transparent background
        closeButton.style.color     = '#333'; // Dark text color
        closeButton.style.border    = '1px solid #333'; // Subtle border
        closeButton.style.borderRadius = '50%';
        closeButton.style.fontSize  = '18px';
        closeButton.style.cursor    = 'pointer';
        closeButton.style.display   = 'flex';
        closeButton.style.justifyContent = 'center';
        closeButton.style.alignItems = 'center';
        closeButton.style.transition = 'all 0.3s ease';
    
        // Hover effects
        closeButton.addEventListener('mouseover', () => {
            closeButton.style.color      = 'white';
            closeButton.style.background = '#333';
        });
    
        closeButton.addEventListener('mouseout', () => {
            closeButton.style.color      = '#333';
            closeButton.style.background = 'transparent';
        });
    
        // Close button functionality
        closeButton.addEventListener('click', () => {
            gridTable.remove(); 
            const lineClassNamGridTable = gridTable.dataset.columnId; 
            const lines = document.querySelectorAll(`.col_${lineClassNamGridTable}`);
            lines.forEach((line) => line.remove());
        });
    
        headerContainer.appendChild(closeButton);
        gridTable.appendChild(headerContainer);
    
        // Add column name
        const columnTitle = document.createElement('p');
        columnTitle.textContent     = `Column: ${columnData.name}`;
        columnTitle.style.margin    = '0';
        gridTable.appendChild(columnTitle);

        
        // Check if columnData.details exists and create a table for it
        if (columnData.columns && Array.isArray(columnData.columns)) {
            const detailsTableDiv           = document.createElement('div');
            detailsTableDiv.className       = 'table-wrapper';
            detailsTableDiv.style.height    = '140px';
            const detailsTable              = document.createElement('table');
            detailsTable.style.width        = '100%';
            detailsTable.className          = "draggable-table";
            detailsTable.style.borderCollapse= 'collapse';
    
            // Add a header row to the table
            const headerRow             = document.createElement('tr');
            const headers               = Object.keys(columnData.columns[0] || {});
            headers.forEach((header) => {
                const th            = document.createElement('th');
                th.textContent      = header;
                th.style.border     = '1px solid #ddd';
                th.style.padding    = '8px';
                th.style.backgroundColor = '#f2f2f2';
                th.style.textAlign  = 'left';               
                th.className        = 'resizable';
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
                    td.textContent      = detail[header];
                    td.style.border     = '1px solid #ddd';
                    td.style.padding    = '8px';                   
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
        const resizeHandle                  = document.createElement('div');
        resizeHandle.className              = 'resize-handle';
        resizeHandle.style.width            = '10px';
        resizeHandle.style.height           = '10px';
        resizeHandle.style.backgroundColor  = 'blue';
        resizeHandle.style.position         = 'absolute';
        resizeHandle.style.right            = '0';
        resizeHandle.style.bottom           = '0';
        resizeHandle.style.cursor           = 'se-resize';    
        gridTable.appendChild(resizeHandle);
    
        // Enable resizing
        resizeHandle.addEventListener('mousedown', (e) => { 
            e.preventDefault();
    
            const startWidth    = gridTable.offsetWidth;
            const startHeight   = gridTable.offsetHeight;
            const startX        = e.clientX;
            const startY        = e.clientY;
    
            function resize(e) {
                const newWidth          = startWidth + (e.clientX - startX);
                const newHeight         = startHeight + (e.clientY - startY);
                gridTable.style.width   = `${newWidth}px`;
                gridTable.style.height  = `${newHeight}px`;
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
    }
}).catch(error => console.error('Error fetching the tables data:', error)); 