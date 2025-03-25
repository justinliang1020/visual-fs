const { ItemView, Notice, Plugin, TFolder, TFile } = require("obsidian");

const VIEW_TYPE_VISUALFS = "visualfs-view";

class VisualFSView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentPath = "/";
  }

  getViewType() {
    return VIEW_TYPE_VISUALFS;
  }

  getDisplayText() {
    return "VisualFS";
  }

  getIcon() {
    return "folder-open";
  }

  async onOpen() {
    this.renderView();
  }

  renderView() {
    const container = this.contentEl;
    container.empty();
    container.addClass("visualfs-view");

    // Create header with back button and current path
    const header = container.createDiv({ cls: "visualfs-header" });

    // Only show back button if not at root
    if (this.currentPath !== "/") {
      const backButton = header.createDiv({
        cls: "visualfs-back-button",
        text: "Back",
      });
      backButton.addEventListener("click", () => {
        // Go up one level
        const pathParts = this.currentPath.split("/").filter((p) => p);
        pathParts.pop(); // Remove last part
        this.currentPath = pathParts.length ? "/" + pathParts.join("/") : "/";
        this.renderView();
      });
    }

    // Path display
    const pathDisplay = header.createDiv({
      cls: "visualfs-path",
      text: this.currentPath,
    });

    // Create grid container
    const grid = container.createDiv({ cls: "visualfs-grid" });

    // Get files and folders in current path
    this.populateGrid(grid);
  }

  populateGrid(gridEl) {
    // Get the current folder
    let folder;

    if (this.currentPath === "/") {
      // Root folder
      folder = this.app.vault.root;
    } else {
      // Get specific folder path
      const folderPath = this.currentPath.slice(1); // Remove leading slash
      folder = this.app.vault.getAbstractFileByPath(folderPath);

      if (!folder || !(folder instanceof TFolder)) {
        this.showErrorMessage("Folder not found: " + this.currentPath);
        this.currentPath = "/";
        folder = this.app.vault.root;
      }
    }

    // Get children sorted: folders first, then files
    const children = folder.children || [];
    const sortedChildren = [
      ...children
        .filter((f) => f instanceof TFolder)
        .sort((a, b) => a.name.localeCompare(b.name)),
      ...children
        .filter((f) => f instanceof TFile)
        .sort((a, b) => a.name.localeCompare(b.name)),
    ];

    if (sortedChildren.length === 0) {
      gridEl.createDiv({
        text: "This folder is empty.",
        cls: "visualfs-empty",
      });
      return;
    }

    // Add each child to the grid
    sortedChildren.forEach((file) => {
      const item = gridEl.createDiv({ cls: "visualfs-item" });

      const iconContainer = item.createDiv({ cls: "visualfs-icon-container" });

      if (file instanceof TFolder) {
        iconContainer.innerHTML =
          '<svg viewBox="0 0 100 100" class="visualfs-folder" width="24" height="24"><path fill="currentColor" d="M 6,19 V 81 H 94 V 19 Z M 49,45 l 45,0 0,30 -90,0 0,-55 30,0 15,25 z"></path></svg>';

        item.addEventListener("click", () => {
          this.navigateToFolder(file.path);
        });
      } else if (file instanceof TFile) {
        iconContainer.innerHTML =
          '<svg viewBox="0 0 100 100" class="visualfs-file" width="24" height="24"><path fill="currentColor" d="M 25,2 V 98 H 75 V 30 L 47,2 Z M 48,29 V 6 L 71,29 Z"></path></svg>';

        item.addEventListener("click", () => {
          this.openFile(file);
        });
      }

      item.createDiv({ text: file.name, cls: "visualfs-item-name" });
    });
  }

  navigateToFolder(path) {
    this.currentPath = "/" + path;
    this.renderView();
  }

  async openFile(file) {
    const leaf = this.app.workspace.getLeaf("split");
    await leaf.openFile(file);
  }

  showErrorMessage(message) {
    new Notice(message);
  }
}

// Export the main VisualFSPlugin class
module.exports = class VisualFSPlugin extends Plugin {
  async onload() {
    this.registerView(
      VIEW_TYPE_VISUALFS,
      (leaf) => new VisualFSView(leaf, this),
    );

    // Add a ribbon icon to toggle the view
    this.addRibbonIcon("layout-grid", "Open VisualFS", async () => {
      await this.toggleView();
    }).addClass("visualfs-icon");

    // Add command to toggle the view
    this.addCommand({
      id: "toggle-visualfs-view",
      name: "Toggle VisualFS View",
      callback: async () => {
        await this.toggleView();
      },
    });
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_VISUALFS);
  }

  async toggleView() {
    const { workspace } = this.app;

    // Check if view is already open
    const existingView = workspace.getLeavesOfType(VIEW_TYPE_VISUALFS)[0];

    if (existingView) {
      // If view exists, close it
      workspace.detachLeavesOfType(VIEW_TYPE_VISUALFS);
      return;
    }

    // Otherwise, create and open the view
    const leaf = workspace.getLeaf("split", "vertical");
    await leaf.setViewState({
      type: VIEW_TYPE_VISUALFS,
      active: true,
    });

    // Reveal the leaf in case it was in a collapsed sidebar
    workspace.revealLeaf(leaf);
  }
};
