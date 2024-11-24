# Drag-and-Drop Grid Application

This project demonstrates a drag-and-drop grid interface for managing and connecting tables and their columns visually. It includes interactive features such as creating connections between items, resizing elements, and dynamic rendering of tables.

## Features

- Drag-and-drop functionality for managing table columns.
- Dynamic creation of visual connections between items.
- Expandable table lists with toggleable column views.
- Resizable and draggable table components in the grid.

## Project Structure

- **index.html**: The main HTML file defining the structure of the application.
- **style.css**: Contains styles for the drag-and-drop grid and its components.
- **script.js**: Implements the functionality for drag-and-drop, resizing, and dynamic rendering.
- **tables.json**: Sample data for the tables and columns.

## How to Use

1. Clone the repository and navigate to the project folder.
2. Open `index.html` in a browser.
3. Use the left panel to explore tables and drag columns into the grid area.
4. Create connections between columns by dragging and dropping.

## How It Works

1. On left there should be list of tables and on the right there should be grid area
2. User should be able to drag any table from list and drop to grid. As user drops the table, table should be created to the available space on the grid.
3. User should be able to change position of table by dragging the table
4. If Dropped table already exist to the grid either Highlight the already existing Table or show alert.
5. Table can be resized
6. User Should be able to drag one column of a table to the other column of other table. When do so there should be a connection line created
7. Connection line should be accommodated correctly on scroll of the table
8. User should be able to remove table from Grid, as he remove Table all connection lines linked to that table will be removed as well

## Vedio Presentation


https://github.com/user-attachments/assets/6ed39edd-67d4-4726-b587-a7181fd73d4e


## Sample Data
The application uses `tables.json` as its data source. It includes:
- Three sample tables with columns.
- Column metadata like `column_id`, `name`, and `DataType`.

## Dependencies
This project uses vanilla JavaScript, CSS, and HTML. No external libraries are required.

## Notes

- Ensure all files (`index.html`, `style.css`, `script.js`, `tables.json`) are in the same directory.
- The application is compatible with modern web browsers.

