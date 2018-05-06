
App.Collections.Categories = Backbone.Collection.extend({
    url: '/api/categories',
    model: App.Models.Category
});