class SearchOject {
    keyword = '';
    results = {};

    constructor()  {
    }

    search(keyword) {
        this.keyword = keyword;
    }

    getSearchById(id) {
        return this.results[id];
    }

    clearSearches() {
        this.results = {};
    }
}

module.exports = SearchOject;