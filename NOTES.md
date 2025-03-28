# notes

create a file explorer plugin for obsidian. call it "visualfs"

first, create a button to be able to toggle this view on and off

for the actual "visualfs" view it just needs to be a grid that has many squares. the grid should be resizable depending on it's dimensions.

each square represents either a folder or file in the current directory the user is in. the initial directory should be the default top level directory?

- if the square is a file: clicking it should open the corresponding file in the editor
- if the square is a folder: it should change the "visualfs" view to go to that directory and reflect the squares there.

for metadata that should be displayed in the view, at the top:

- include a back button to go above a directory (if not in the top level directory)
- also display the path to the current directory i.e. `/folder1/folder2`

---

make the squares actually square in dimension (width == height)

for both file and folder:

- a white square with a black border that is 2px. it has some padding inside the square
- size of squares should be constant even when resizing, only the layout should change
- currently the squares use icons, i don't need these icons get rid of them

file:

- content in box: contains the first few words of the text file
- the name of the file should be displayed directly below the square

folder:

- content in box: name of the file and number of children it contains (files + folders)

---

change the content of the folder blocks to contain the following

- name of the folder
- a list of names of all content of that folder.
  - if a piece of content is a file, prepend the name with 📄
  - if a piece of content is a folder, prepend the name with 📁

---

change the header so that it works like the following:

- no more back button to navigate
- the new header is simply a string that starts with 🏠 icon and has the folders path like 🏠/folder1/folder2
- navigate to index by pressing 🏠 icon.
- navigate to any folder by clicking on the folder name in the path
- making the slashes the default color, but make the folders the obsidian css link color

i.e. 🏠/folder1/folder2

---

next features

- add folder/file
- delete folder/file
- rename folder/file
- keyboard navigation

---
