
//APP VIEW
App.Views.AppView = Backbone.View.extend({
    initialize: function () {
        entriesList = new App.Views.EntriesList({el: '#transactions .card-content'});
        categories = new App.Collections.Categories();
        categories.fetch();
        this.budget = $('h2#budget span');
        colors = this.getCategoriesColors();
    },
    events: {
        "click #showIncomeModal": "showModal",
        "click #showExpenseModal": "showModal",
        "click #showCategoryModal": "showModal",
        "click #addIncome": "addEntry",
        "click #addExpense": "addEntry",
        "click #addCategory": "addNewCategory"
    },
    showModal: function (event) {
        if (event.currentTarget.id == "showCategoryModal") {
            var html = new EJS({url: 'js/templates/category-modal.ejs'}).render();
            this.$el.append(html);
            $('#category-modal').openModal({
                complete: function () {
                    $('#category-modal').remove();
                }
            });
            $.ajax({
                url: "api/colors",
                type: "get",
                complete: function (response) {
                    if (response) {
                        _.map(response.responseJSON, function (color) {
                            $('select#color').append('<option value="' + color.id + '" data-color="' + color.color_name + '">' + color.color_name + '</option>');
                        });
                        $('select#category-type, select#color').material_select();
                    }
                }
            });
        } else {
            modal = new EJS({url: 'js/templates/modal.ejs'});
            if (event.currentTarget.id == 'showIncomeModal') {
                var incomeCategories = categories.where({type: 1});
                this.$el.append(modal.render({type: 'income', categories: incomeCategories}));
            } else {
                var expensesCategories = categories.where({type: 2});
                this.$el.append(modal.render({type: 'expense', categories: expensesCategories}));
            }
            $('#modal').openModal({
                complete: function () {
                    $('#modal').remove();
                }
            });
            $('select#category').material_select();
            $('.datepicker').pickadate({
                selectMonths: true,
                selectYears: 15,
                container: 'main',
            });
        }
    },
    addEntry: function (event) {
        var name = $('#modal input#name').val();
        var value = $('#modal input#value').val();
        var category_id = $('#modal select#category').val();
        var date = $('#modal input#date').val();
        var category_name = $('#modal select#category option:selected').text();
        category_name = category_name.trim().replace(/(\r\n|\n|\r)/gm, "");
        var category = categories.where({name: category_name});
        var color = _.where(colors, {id: category[0].get('color_id')});
        if (event.currentTarget.id == 'addIncome') {
            var model = new App.Models.Entry({
                className: 'income',
                name: name,
                value: value,
                categoryColor: color[0]['color_name'],
                category_id: category_id,
                category: category_name,
                type: 1,
                date: date
            });

        } else if (event.currentTarget.id == 'addExpense') {
            var model = new App.Models.Entry({
                className: 'expense',
                name: name,
                value: value,
                categoryColor: color[0]['color_name'],
                category_id: category_id,
                category: category_name,
                type: 2,
                date: date
            });
        }
        var view = new App.Views.Entry({model: model}); // for binding the validation
        if(model.isValid()) {
            $('#modal').closeModal();
            $('#modal').remove();
            entriesList.transactions.add(model);
            expenseChartView = new App.Views.Chart({model: charts['expenseGraph']});
            expenseChartView.model.trigger('change');
            this.budget.html(entriesList.getBudget());
            model.save();
        }
    },
    getCategoriesColors: function () {
        var colors = null;
        $.ajax({
            async: false,
            url: "api/colors",
            type: "get",
            success: function (response) {
                if (response) {
                    colors = response;
                }
            }
        });
        return colors;
    },
    addNewCategory: function () {
        var name, type, color, categoryModel;
        name = $('#category-modal input#category').val();
        type = $('#category-modal select#category-type').val();
        color = $('#category-modal select#color').val();
        categoryModel = new App.Models.Category({name: name, type: type, color: color});
        categories.add(categoryModel);
        categoryModel.save();
        categories.fetch();
    },
    makeExpensesByDayChart: function () {
        var expenseGraphModel = charts['expenseGraph'];
        var expenseGraphView = new App.Views.Chart({model: expenseGraphModel});
        this.$el.find('#content #transactions').before(expenseGraphView.render(700, 200));
        expenseGraphView.createLineGraph(expenseGraphModel);
    }
});
