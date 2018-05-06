
var INCOME = 1, EXPENSE = 2;


var router = new (App.Router.AppRouter = Backbone.Router.extend({
    routes: {
        "today": "getTodayTransactions",
        "incomes/:number": "getIncomes",
        "expenses/:number": "getExpenses",
        "stats/incomes": "showIncomesStats",
        "stats/expenses": "showExpensesStats",
        "category/:category": "showCategory",
        "login": "login",
        "signout": "signout",
        "register": "register",
        "dashboard": "index"
    },
    initialize: function () {
        $('body').on("click", "a:not([data-bypass])", function (evt) {
            var href = {prop: $(this).prop("href"), attr: $(this).attr("href")};
            var root = location.protocol + "//" + location.host + Backbone.history.options.root;

            if (href.prop && href.prop.slice(0, root.length) === root) {
                evt.preventDefault();
                Backbone.history.navigate(href.attr, true);
            }
        });
        $(".button-collapse").sideNav();
    },
    index: function () {
        var _router = this;
        var renderDashboard = function() {
            if(!$('main').length || (typeof appView === typeof undefined)) {
                appView = new App.Views.AppView({el: "main > .container"});
            }
            if (!entriesList.transactions.length) {
                _router.getTransactions(false);
            }
            if (!entriesList.$el.find('tbody').length) {
                //appView.$el.find('#content').html('');
                var html = new EJS({url: '/js/templates/dashboard.ejs'}).render({context: 'dashboard'});
                console.log(html);
                appView.$el.find('#content').html(html);
                console.log(appView.$el.find('#content').html());
                var i = 0;
                _.some(entriesList.transactions.models, function (model) {
                    i++;
                    var view = new App.Views.Entry({model: model});
                    var html = view.render().el;
                    appView.$el.find('tbody').append(html);
                    if (i == 10) {
                        return true;
                    }
                });
            }
            appView.$el.find('#table-title').html('Last 10 transactions');
            if (appView.$el.find('canvas#expensesPerDay').attr('id') != 'expensesPerDay') {
                appView.makeExpensesByDayChart();
            }
            $('.tooltipped').tooltip({delay: 50});
            $('.collapsible').collapsible();
        };

        if($('#content-wrapper').length) {
            var pageHTML = new EJS({url: 'js/templates/index.ejs'}).render();
            $('#content-wrapper').html(pageHTML).fadeIn(1000,function(){
                $('#content-wrapper').replaceWith(function(){
                    return $(this).html();
                });
                renderDashboard();
            });
        }else {
            renderDashboard();
        }
    },
    login: function() {
        $('body').html(new EJS({url: 'js/templates/login.ejs'}).render());
        var login = new App.Views.Login({el: $('#login')});
    },
    register: function() {
        $('body').html(new EJS({url: 'js/templates/register.ejs'}).render());
        var register = new App.Views.Register({el: $('#register')});
    },
    signout: function() {
        var _router = this;
        $.post({
           url: "api/signout",
           data: {id: 10}, // to be changed
            success: function(result){
                if(!result.error) {
                    _router.navigate('login', {trigger: true});
                }
            }
        });
    },
    getIncomes: function (number) {
        if (!entriesList.transactions.length) {
            this.getTransactions(false);
        }
        appView.$el.find('#content').html('');
        var dashboardTemplate = new EJS({url: 'js/templates/dashboard.ejs'});

        var min = (number - 1) * 10;
        var max = (number * 10);

        var incomes = entriesList.transactions.filter({type: 1});
        var totalNumber = incomes.length;
        incomes = incomes.slice(min, max);
        appView.$el.find('#content').html(dashboardTemplate.render({
            context: 'incomes',
            totalEntries: totalNumber,
            activePageNumber: number
        }));
        _.each(incomes, function (model) {
            var view = new App.Views.Entry({model: model});
            var html = view.render().el;
            appView.$el.find('tbody').prepend(html);
        });
        appView.$el.find('#table-title').html('Incomes');
    },
    getExpenses: function (number) {
        if (!entriesList.transactions.length) {
            this.getTransactions(false);
        }
        appView.$el.find('#content').html('');
        var dashboardTemplate = new EJS({url: 'js/templates/dashboard.ejs'});
        var min = (number - 1) * 10;
        var max = (number * 10);

        var expenses = entriesList.transactions.filter({type: 2});
        var totalNumber = expenses.length;
        expenses = expenses.slice(min, max);
        appView.$el.find('#content').html(dashboardTemplate.render({
            context: 'expenses',
            totalEntries: totalNumber,
            activePageNumber: number
        }));
        _.each(expenses, function (model) {
            var view = new App.Views.Entry({model: model});
            var html = view.render().el;
            appView.$el.find('tbody').prepend(html);
        });
        appView.$el.find('#table-title').html('Expenses');
    },
    showCategory: function (category) {
        appView.$el.find('tbody').html('');
        appView.$el.find('#table-title').html('Category: ' + category);
        entriesList.transactions.each(function (model) {
            if (model.get('category') == category) {
                var view = new App.Views.Entry({model: model});
                appView.$el.find('#transactions-wrapper tbody').append(view.render().el);
            }
        });
    },
    getTransactions: function (async) {
        entriesList.transactions.fetch({async: async});
    },
    getTodayTransactions: function () {
        entriesList.$el.html('');
        var today = moment().format('DD.MM.YYYY');
        entriesList.transactions.each(function (model) {
            var date = model.get('date');
            if (date == today) {
                if (model.get('type') == INCOME) {
                    model.set('className', 'income');
                    var view = new App.Views.Entry({model: model});
                    entriesList.$el.append(view.render().el);
                } else if (model.get('type') == EXPENSE) {
                    model.set('className', 'expense');
                    var view = new App.Views.Entry({model: model});
                    entriesList.$el.append(view.render().el);
                }
            }
        });
    },
    showIncomesStats: function () {
        var incomesChart = new App.Views.Chart({model: charts['incomes']});
        var content = incomesChart.render(300, 200);
        incomesChart.createIncomesPage(content);
    },
    showExpensesStats: function () {
        var content = [];
        var expensesPerCategoryChart = new App.Views.Chart({model: charts['expenses']});
        var expensesPerMonthChart = new App.Views.Chart({model: charts['expenses-per-month']});
        content['expenses-per-category'] = expensesPerCategoryChart.render(300, 200);
        content['expenses-per-month'] = expensesPerMonthChart.render(700, 200);
        expensesPerCategoryChart.createExpensesPage(content);
    }
}));

Backbone.history.start();