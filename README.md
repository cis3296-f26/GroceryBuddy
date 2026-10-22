# Grocery Buddy

## Project Description

Grocery Buddy is a web app that helps college students keep track of their groceries and eat food before it goes bad. Students add groceries in a few quick steps: the food, how much they have, where it is stored (fridge, freezer, or pantry), and the date they bought it. The app estimates how long each item will last and shows a dashboard with labels like "Use Today," "Use Soon," "Good for Now," and "Past Estimate." Students can mark food as used or thrown away, keep a shopping list, and get AI recipe ideas for food that needs to be used soon.

**Project status:** We are just getting started. Right now the app only shows the React + Vite starter page. The features above are planned and will be added during the semester. Our proposal also plans a Python/Django backend and a PostgreSQL database, and we will add those setup steps here when they are ready.

## Installation Instructions

You need these programs before you start:

- [Git](https://git-scm.com/downloads), to download the code
- [Node.js](https://nodejs.org/) version 20.19 or newer, which also installs npm (the tool that downloads the project's packages)
- A code editor such as [VS Code](https://code.visualstudio.com/) (optional)

To check that Node.js is installed, open a terminal and run:

```bash
node --version
```

Then download the project and install its packages:

```bash
git clone https://github.com/cis3296-f26/GroceryBuddy.git
cd GroceryBuddy
npm install
```

You only need to run `npm install` the first time, and again if someone adds a new package.

## Build Instructions

Inside the `GroceryBuddy` folder, run:

```bash
npm run build
```

This makes a `dist` folder with the finished files that a web server can host.

## Run Instructions

To start the app while you work on it, run:

```bash
npm run dev
```

The terminal shows a link, usually http://localhost:5173. Open it in your web browser to see the app. The page updates by itself when you save a file. To stop the app, click in the terminal and press `Ctrl + C`.

To try the version you built in the Build step, run:

```bash
npm run preview
```

Then open the link it shows, usually http://localhost:4173.

These steps were tested on Windows 11 with Node.js 24 and npm 11.