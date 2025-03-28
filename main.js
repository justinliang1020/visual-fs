const {
  ItemView,
  Notice,
  Plugin,
  TFolder,
  TFile,
  MarkdownRenderer,
} = require("obsidian");

const VIEW_TYPE_VISUALFS = "visualfs-view";
const FILE_PREVIEW_CONTENT_LENGTH = 500;
const TEXT_EXTENSIONS = ["txt", "js", "css", "html", "json"];

class VisualFSView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentPath = "/";
    this.component = this; // Add component reference for MarkdownRenderer
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
    header.createDiv({
      cls: "visualfs-path",
      text: this.currentPath,
    });

    // Create grid container
    const grid = container.createDiv({ cls: "visualfs-grid" });

    // Get files and folders in current path
    this.populateGrid(grid);
  }

  populateGrid(gridEl) {
    /** @type TFolder */
    let folder = this.getCurrentFolder();

    // Get children sorted by last modified time
    const children = folder.children || [];

    // Sort all children by mtime (most recent first)
    const sortedChildren = this.sortFilesByTime(children);

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

      const square = item.createDiv({ cls: "visualfs-square" });

      if (file instanceof TFolder) {
        square.addClass("visualfs-folder-square");

        // Create folder name heading
        square.createDiv({
          text: file.name,
          cls: "visualfs-square-content visualfs-folder-name",
        });

        // Create content list
        const contentList = square.createDiv({
          cls: "visualfs-folder-contents",
        });

        const sortedChildren = this.sortFilesByTime(file.children || []);

        // Add each child with appropriate icon
        sortedChildren.forEach((child) => {
          const icon = child instanceof TFolder ? "🗂️" : "📄";
          contentList.createDiv({
            text: `${icon} ${child.name}`,
            cls: "visualfs-folder-child",
          });
        });

        item.addEventListener("click", () => {
          this.navigateToFolder(file.path);
        });

        // Get the folder's last modified time
        const folderMtime = this.getFolderMtime(file);
        if (folderMtime > 0) {
          item.createDiv({
            text: this.formatDate(folderMtime),
            cls: "visualfs-item-metadata",
          });
        }
      } else if (file instanceof TFile) {
        square.addClass("visualfs-file-square");

        // Get file preview content
        this.getFilePreview(file, square);

        item.addEventListener("click", () => {
          this.openFile(file);
        });

        item.createDiv({
          text: this.formatDate(file.stat.mtime),
          cls: "visualfs-item-metadata",
        });
      }
    });
  }

  navigateToFolder(path) {
    this.currentPath = "/" + path;
    this.renderView();
  }

  async openFile(file) {
    const leaf = this.app.workspace.getLeaf();
    await leaf.openFile(file);
  }

  showErrorMessage(message) {
    new Notice(message);
  }

  getFolderMtime(folder) {
    if (!folder.children || folder.children.length === 0) {
      return 0; // Default timestamp for empty folders
    }

    // Get the most recent mtime from all children
    return Math.max(
      ...folder.children.map((child) => {
        if (child instanceof TFolder) {
          return this.getFolderMtime(child);
        }
        return child.stat.mtime;
      }),
    );
  }

  async getFilePreview(file, container) {
    try {
      if (file.extension === "md") {
        await this.renderMarkdownPreview(file, container);
        return;
      }

      if (TEXT_EXTENSIONS.includes(file.extension)) {
        await this.renderTextPreview(file, container);
        return;
      }

      // Handle other file types
      container.createDiv({
        text: file.extension.toUpperCase() + " file",
        cls: "visualfs-square-content",
      });
    } catch (error) {
      console.error("Error getting file preview:", error);
      container.createDiv({
        text: "Preview unavailable",
        cls: "visualfs-square-content",
      });
    }
  }

  async renderMarkdownPreview(file, container) {
    // Create a container for the markdown preview
    const contentEl = container.createDiv({
      cls: "visualfs-square-content visualfs-md-preview",
    });

    let content = await this.app.vault.cachedRead(file);

    // Use the plugin's render method if available, otherwise fallback to text
    try {
      if (!content.trim().startsWith("# ")) {
        content = `# ${file.name.replace(/\.md$/, "")}\n\n${content}`;
      }
      await MarkdownRenderer.render(this, content, contentEl, file.path);
    } catch (renderError) {
      console.error("Markdown render error:", renderError);
      contentEl.setText(content);
    }
  }

  async renderTextPreview(file, container) {
    const content = await this.app.vault.cachedRead(file);
    const preview =
      content.trim().substring(0, FILE_PREVIEW_CONTENT_LENGTH) +
      (content.length > FILE_PREVIEW_CONTENT_LENGTH ? "..." : "");

    container.createDiv({
      text: preview,
      cls: "visualfs-square-content",
    });
  }
}

/**
 * Formats a timestamp into a human-readable string showing days since modification
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Human readable string either "Today" or "X days ago"
 */
VisualFSView.prototype.formatDate = function (timestamp) {
  const date = new Date(timestamp);
  const daysSinceModified = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  return daysSinceModified === 0 ? "Today" : `${daysSinceModified} days ago`;
};

/**
 * Sorts an array of files and folders by their modification time in descending order
 * @param {Array<TFile|TFolder>} files - Array of files and folders to sort
 * @returns {Array<TFile|TFolder>} Sorted array with newest items first
 */
VisualFSView.prototype.sortFilesByTime = function (files) {
  return files.sort((a, b) => {
    const aTime = a instanceof TFolder ? this.getFolderMtime(a) : a.stat.mtime;
    const bTime = b instanceof TFolder ? this.getFolderMtime(b) : b.stat.mtime;
    return bTime - aTime; // Descending order (newest first)
  });
};

/**
 * Gets the current folder based on the currentPath property
 * @returns {TFolder} The current folder object. Returns root folder if path is "/" or if specified folder not found
 */
VisualFSView.prototype.getCurrentFolder = function () {
  if (this.currentPath === "/") {
    // Root folder
    return this.app.vault.root;
  }

  // Get specific folder path
  const folderPath = this.currentPath.slice(1); // Remove leading slash
  const folder = this.app.vault.getAbstractFileByPath(folderPath);

  if (!folder || !(folder instanceof TFolder)) {
    this.showErrorMessage("Folder not found: " + this.currentPath);
    this.currentPath = "/";
    return this.app.vault.root;
  }

  return folder;
};

module.exports = class VisualFSPlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE_VISUALFS, (leaf) => {
      const view = new VisualFSView(leaf, this);
      // Pass the plugin's render method to the view
      view.renderMarkdown = this.renderMarkdown;
      return view;
    });

    // BUG: weird component missing error
    // app.js:1 Error: Plugin "visualfs" is not passing Component in renderMarkdown. This is needed to avoid memory leaks when embedded contents register global event handlers.
    // at t.render (app.js:1:1512063)
    // at VisualFSView.getFilePreview (VM147 plugin:visualfs:240:34)
    //
    // // Register the markdown processor with the component
    // this.registerMarkdownPostProcessor = (processor) => {
    //   this.app.markdownPostProcessor.registerPostProcessor(processor);
    // };
    //
    // // Add function to easily render markdown
    // this.renderMarkdown = async (markdown, el, sourcePath) => {
    //   el.innerHTML = "";
    //   await MarkdownRenderer.render(markdown, el, sourcePath, this);
    //   return;
    // };

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

    // Otherwise, create and open the view in a new tab
    const leaf = workspace.getLeaf();
    await leaf.setViewState({
      type: VIEW_TYPE_VISUALFS,
      active: true,
    });

    // Reveal the leaf in case it was in a collapsed sidebar
    workspace.revealLeaf(leaf);
  }
};
