# VisualFS Plugin for Obsidian

VisualFS is a visual file explorer for [Obsidian](https://obsidian.md) that displays files and folders in a grid-based view. It provides an alternative way to navigate your vault with a visual interface.

## Features

- Grid-based file explorer view
- Toggle the view with a ribbon icon or command
- Navigate folders by clicking on folder icons
- Open files directly from the grid
- Back button to navigate up in the folder hierarchy
- Current path display

## How to Use

1. Install the plugin in your Obsidian vault
2. Click the grid icon in the left ribbon or use the command "Toggle VisualFS View"
3. A new pane will open with the grid view of your vault's root directory
4. Click on folders to navigate into them
5. Click on files to open them
6. Use the "Back" button to navigate up to parent folders

## Navigation

- **Opening Files**: Click on any file to open it in a new pane
- **Navigating Folders**: Click on folder icons to browse into that folder
- **Going Back**: Use the "Back" button at the top to go to the parent folder
- **Current Path**: The current path is displayed at the top of the view

## Development

This plugin is built with plain JavaScript and requires no build step. It uses the Obsidian API to handle file system interactions and view rendering.

## Installation

### From Obsidian Community Plugins

*(Once published)*
1. Open Obsidian Settings
2. Go to "Community Plugins"
3. Disable Safe Mode if necessary
4. Click "Browse" and search for "VisualFS"
5. Install the plugin
6. Enable the plugin in your list of installed plugins

### Manual Installation

1. Download the latest release from the GitHub repository
2. Extract the zip file into your `.obsidian/plugins/` folder
3. Enable the plugin in your Obsidian settings

## License

This project is licensed under the MIT License.
