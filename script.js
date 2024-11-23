const gridArea    = document.getElementById('grid-area');
const tableList   = document.getElementById('table-list');
const container   = document.getElementById("grid-area");
const tables      = document.querySelectorAll(".draggable-table");
let connections   = [];
let draggedElement= null;

    // Create a line between two cells
    function createLine(startElement, endElement) {
      const startRect     = startElement.getBoundingClientRect();
      const endRect       = endElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const startX    = startRect.right - containerRect.left;
      const startY    = startRect.top + startRect.height / 2 - containerRect.top;
      const endX      = endRect.left - containerRect.left;
      const endY      = endRect.top + endRect.height / 2 - containerRect.top;
      const line      = document.createElement("div");
      line.classList.add("line");

      const length          = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      const angle           = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

      line.style.width      = `${length}px`;
      line.style.left       = `${startX}px`;
      line.style.top        = `${startY}px`;
      line.style.transform  = `rotate(${angle}deg)`;
      container.appendChild(line);
      connections.push({ line, startElement, endElement });
    }

    // Synchronize lines when scrolling
    function syncLines() {
      connections.forEach(({ line, startElement, endElement }) => {
        const startRect     = startElement.getBoundingClientRect();
        const endRect       = endElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const startX        = startRect.right - containerRect.left;
        const startY        = startRect.top + startRect.height / 2 - containerRect.top;
        const endX          = endRect.left - containerRect.left;
        const endY          = endRect.top + endRect.height / 2 - containerRect.top;

        const length        = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const angle         = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

        line.style.width     = `${length}px`;
        line.style.left      = `${startX}px`;
        line.style.top       = `${startY}px`;
        line.style.transform = `rotate(${angle}deg)`;
      });
    }

    // Delete table and its associated lines
    function deleteTable(container) {
      const table           = container.querySelector("table");
      connections           = connections.filter(({ line, startElement, endElement }) => {
          const isConnected = table.contains(startElement) || table.contains(endElement);
          if (isConnected) line.remove();
          return !isConnected;
      });
      container.remove();
    }
    // Add scroll event listeners to all table containers
    document.querySelectorAll(".table-container").forEach(container => {
            container.addEventListener("scroll", syncLines);
    });
// Fetch table data from the JSON file
fetch('tables.json').then(response => response.json()).then(data => {

    const tables = [...data["table 1"], ...data["table 2"], ...data["table 3"]]; // Combine tables from all sources
    // Populate table list with expandable cards
    tables.forEach(table => {
          const tableCard = createTableCard(table);
          tableList.appendChild(tableCard);
    });

    // Function to create table card with columns
    function createTableCard(table) {
      const tableCard         = document.createElement('div');
      tableCard.className     = 'card';
      
      const tableTitle        = document.createElement('h3');
      tableTitle.textContent  = table.name;
      
      const toggleIcon        = document.createElement('span');
      toggleIcon.textContent  = ' + ';
      toggleIcon.className    = 'toggle-icon';
      tableTitle.appendChild(toggleIcon);
      
      const columnsList       = document.createElement('ul');
      
      table.columns.forEach(column => {
            const columnItem            = document.createElement('li');
            columnItem.textContent      = `${column.name}`;
            columnItem.draggable        = true;
            columnItem.dataset.columnId = column.column_id;
            columnItem.dataset.tableId  = table.id;
            columnItem.classList.add('draggable-column');
            columnsList.appendChild(columnItem);
      });

      tableCard.appendChild(tableTitle);
      tableCard.appendChild(columnsList);

      // Toggle columns visibility when clicking the table title
      toggleIcon.addEventListener('click', () => {
            if (columnsList.style.display === 'none') {
                  columnsList.style.display = 'block';
                  toggleIcon.textContent    = ' - ';
            } else {
                  columnsList.style.display = 'none';
                  toggleIcon.textContent    = ' + ';
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
        const columnId            = e.dataTransfer.getData('column-id');
        const tableId             = e.dataTransfer.getData('table-id');
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
              deleteTable(gridTable);
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
                // dataRow.draggable        = 'true';
                dataRow.className        = 'draggable-row';
                headers.forEach((header) => {
                    const td = document.createElement('td');
                    td.textContent      = detail[header];
                    td.style.border     = '1px solid #ddd';
                    td.style.padding    = '8px';        
                    td.draggable        = true;
                    td.className        = 'draggable';   
                    td.addEventListener("dragstart", event => {
                          draggedElement                   = event.target;
                          event.dataTransfer.effectAllowed = "move";
                    });
                    td.addEventListener("dragover", event => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                    });          
                    td.addEventListener("drop", event => {
                          event.preventDefault();
                          if (draggedElement) {
                                const targetRow = event.target.closest("tr");
                                if (targetRow) {
                                      targetRow.cells[0].innerText = draggedElement.innerText;
                                      createLine(draggedElement, targetRow.cells[0]);
                                      draggedElement = null;
                                }
                          }
                    });
                    dataRow.appendChild(td);
                });
                detailsTable.appendChild(dataRow);
            });
            gridTable.appendChild(detailsTable);
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