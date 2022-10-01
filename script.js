class BeerController {
  constructor(BeerView, BeerModel) {
    this.BeerView = BeerView;
    this.BeerModel = BeerModel;

    this.BeerModel.bindBeersListChanged(this.onBeerListChange);
    this.BeerView.bindAddToFavourites(this.handleAddToFavourites);
    this.BeerView.bindRemoveFromFavourites(this.handleRemoveFromFavourites);
    this.BeerModel.bindOnApiError(this.handleAppiError);
    this.BeerView.bindSearchBeer(this.handleSearch);
  }

  onBeerListChange = (beers, favouriteBeers) => {
    this.BeerView.displayBeers(beers, favouriteBeers);
  };

  handleAddToFavourites = (id) => {
    this.BeerModel.addToFavourites(id);
  };

  handleRemoveFromFavourites = (id) => {
    this.BeerModel.removeFromFavourites(id);
  };

  handleAppiError = () => {
    this.BeerView.showErrorMessage();
  };

  handleSearch = (text) => {
    this.BeerModel.searchBeer(text);
  };
}

class BeerView {
  constructor() {
    this.root = this.getElement("#root");
    this.allTitle = this.createElement("h1", "title");
    this.favouritesTitle = this.createElement("h1", "title");
    this.searchTitle = this.createElement("h1", "title");
    this.beersListWrapper = this.createElement("ul");
    this.favouriteBeersListWrapper = this.createElement("ul");
    this.allColumn = this.createElement("div", "column");
    this.favouritesColumn = this.createElement("div", "column");
    this.searchColumn = this.createElement("div", ["column", 'search-column']);
    this.searchInput = this.createElement("input");
    this.searchButton = this.createElement("button");
    this.loader = this.createElement("div", "loader");

    this.showLoader();
  }

  createElement(tag, classNames) {
    const element = document.createElement(tag);
    
    if(!classNames){
        return element
    }

    if(typeof classNames === 'string'){
        element.classList.add(classNames);
        return element
    }

    classNames.forEach((className) => {
        element.classList.add(className);
    })

    return element;
  }

  getElement(selector) {
    return document.querySelector(selector);
  }

  showErrorMessage() {
    this.removeLoader();
    const errorMessage = this.createElement("h1", "error");
    errorMessage.innerHTML = "Something went wrong during api fetch";

    this.root.append(errorMessage);
  }

  init() {
    this.removeLoader();
    this.allTitle.innerText = "Beers list";
    this.favouritesTitle.innerText = "Favourite beers";
    this.searchTitle.innerText = "Search";
    this.searchButton.innerHTML = "Search";
    this.root.append(this.allColumn);
    this.root.append(this.favouritesColumn);
    this.root.append(this.searchColumn);
    this.searchColumn.append(this.searchTitle);
    this.searchColumn.append(this.searchInput);
    this.searchColumn.append(this.searchButton);
    this.allColumn.append(this.allTitle);
    this.allColumn.append(this.beersListWrapper);
    this.favouritesColumn.append(this.favouritesTitle);
    this.favouritesColumn.append(this.favouriteBeersListWrapper);
  }

  showLoader() {
    this.root.append(this.loader);
  }

  removeLoader() {
    const loader = document.getElementsByClassName("loader")[0];
    if (loader) {
      loader.remove();
    }
  }

  displayBeers(beers, favouriteBeers) {
    this.init();
    while (this.beersListWrapper.firstChild) {
      this.beersListWrapper.removeChild(this.beersListWrapper.firstChild);
    }

    while (this.favouriteBeersListWrapper.firstChild) {
      this.favouriteBeersListWrapper.removeChild(
        this.favouriteBeersListWrapper.firstChild
      );
    }

    beers.forEach((beer) => {
      const listItem = this.createElement("li");
      const button = this.createElement("button", "favourite-button");
      button.innerHTML = "Favourite ⭐";
      button.id = `beer-button-${beer.id}`;
      listItem.innerHTML = beer.name;
      listItem.append(button);
      this.beersListWrapper.append(listItem);
    });

    favouriteBeers.forEach((beer) => {
      const listItem = this.createElement("li");
      const button = this.createElement("button", "remove-button");
      button.innerHTML = "Remove";
      button.id = `beer-button-${beer.id}`;
      listItem.innerHTML = beer.name;
      listItem.append(button);
      this.favouriteBeersListWrapper.append(listItem);
    });
  }

  bindAddToFavourites(callback) {
    this.beersListWrapper.addEventListener("click", (event) => {
      if ([...event.target.classList].includes("favourite-button")) {
        const id = event.target.id.split("-")[2];
        callback(id);
      }
    });
  }

  bindRemoveFromFavourites(callback) {
    this.favouriteBeersListWrapper.addEventListener("click", (event) => {
      if ([...event.target.classList].includes("remove-button")) {
        const id = event.target.id.split("-")[2];
        callback(id);
      }
    });
  }

  bindSearchBeer(callback) {
    this.searchButton.addEventListener("click", (e) => {
      callback(this.searchInput.value);
    });
  }
}

class BeerModel {
  constructor() {
    this.beersList = [];
    this.favourites = [];

    this.getBeersData();
  }

  async getBeersData() {
    const url = "https://api.sampleapis.com/beers/ale";
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      this.onApiError();
      throw new Error("Something went wrong");
    }

    this.beersList = data;
    this.onBeersListChange(this.beersList, this.favourites);
  }

  getBeers() {
    return this.beersList;
  }

  getBeerByIndex(id) {
    let beer = this.beersList.filter((beer) => beer.id === parseInt(id));
    if (!beer.length) {
      beer = this.favourites.filter((beer) => beer.id === parseInt(id));
    }
    return beer[0];
  }

  commit(filteredBeersList, filteredFavourites) {
    let beerList = filteredBeersList ? filteredBeersList : this.beersList;
    let favouritesList = filteredFavourites
      ? filteredFavourites
      : this.favourites;

    beerList = beerList.sort((a, b) => a.id - b.id);
    favouritesList = favouritesList.sort((a, b) => a.id - b.id);

    this.onBeersListChange(beerList, favouritesList);
  }

  addToFavourites(id) {
    const beerToMove = this.getBeerByIndex(id);

    this.favourites.push(beerToMove);
    this.beersList = this.beersList.filter((beer) => beer.id !== beerToMove.id);

    this.commit();
  }

  removeFromFavourites(id) {
    const beerToMove = this.getBeerByIndex(id);

    this.beersList.unshift(beerToMove);
    this.favourites = this.favourites.filter(
      (beer) => beer.id !== beerToMove.id
    );

    this.commit();
  }

  searchBeer(text) {
    let filteredBeersList = this.beersList;
    let filteredFavourites = this.favourites;

    if (text) {
      filteredBeersList = this.beersList.filter((beer) =>
        beer.name.includes(text)
      );
      filteredFavourites = this.favourites.filter((beer) =>
        beer.name.includes(text)
      );
    }

    this.commit(filteredBeersList, filteredFavourites);
  }

  bindBeersListChanged(callback) {
    this.onBeersListChange = callback;
  }

  bindOnApiError(callback) {
    this.onApiError = callback;
  }
}

const view = new BeerView();
const model = new BeerModel();
const controller = new BeerController(view, model);
