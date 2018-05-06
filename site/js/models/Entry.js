

// BASIC ENTRY MODEL
App.Models.Entry = Backbone.Model.extend({
    validation: {
        name: {
            required: true,
            msg: "The name is required"
        },
        value: {
            required: true,
            pattern: 'digits',
            msg: "This field is mandatory and must contains only digits"
        }
    },
    defaults: {
        className: "",
        type: "",
        name: "standard entry",
        value: "0",
        category: "default category",
        category_id: 0,
        categoryColor: '',
        date: ''
    }
});