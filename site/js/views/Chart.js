

var expensesLineChart = null;
App.Views.Chart = Backbone.View.extend({
    tagName: 'div',
    className: 'card waves-effect waves-block waves-light',
    initialize: function () {
        this.model.on('change', this.createLineGraph(this.model), this);
    },
    template: new EJS({url: 'js/templates/graph.ejs'}),
    render: function (width,height) {
        var attributes = this.model.toJSON();
        attributes['width'] = width;
        attributes['height'] = height;
        this.$el.html(this.template.render(attributes));
        return this.$el.html();
    },
    createExpensesPage: function(content) {
        var date = true;
        var statsTemplate = new EJS({url: 'js/templates/stats.ejs'});
        appView.$el.find('#content').html('');
        appView.$el.find('#content').append(statsTemplate.render({expensesPerMonth: content['expenses-per-month'], expensesPerCategory: content['expenses-per-category']}));
        $('#start-date').pickadate({
            onSet: function() {
                date = this.get('select');
                picker.set('enable',true);
                picker.set('disable',
                    [
                        { from : [2016,1,1], to: [date.year, date.month, date.date]}
                    ]
                );
            }
        });
        var input = $('#end-date').pickadate();
        var picker = input.pickadate('picker');
        this.createExpensePieChart(charts['expenses']);
        this.createExpensesLineChart(charts['expenses-per-month']);
    },
    createIncomesPage: function(content) {
        var date = true;
        var statsTemplate =new EJS({url: 'js/templates/stats.ejs'});
        appView.$el.find('#content').html('');
        appView.$el.find('#content').append(statsTemplate.render({content: content}));
        $('#start-date').pickadate({
            onSet: function() {
                date = this.get('select');
                picker.set('enable',true);
                picker.set('disable',
                    [
                        { from : [2016,1,1], to: [date.year, date.month, date.date]}
                    ]
                );
            }
        });
        var input = $('#end-date').pickadate();
        var picker = input.pickadate('picker');
        this.createIncomePieChart(charts['incomes']);
    },
    createLineGraph: function (model) {
        var canvasId = model.get('canvasId');
        if (expensesLineChart) {
            expensesLineChart.destroy();
        }
        if ($('#' + canvasId).length) {
            lineCtx = $('#' + canvasId).get(0).getContext('2d');
            var i, lineCtx, data, day, expensesPerDay, date;
            expensesPerDay = {
                "Monday": 0,
                "Tuesday": 0,
                "Wednesday": 0,
                "Thursday": 0,
                "Friday": 0,
                "Saturday": 0,
                "Sunday": 0
            };
            entriesList.transactions.each(function (model) {
                if (model.get('type') == EXPENSE) {
                    date = model.get('date');
                    if (date) {
                        day = moment(date, "D-MMMM-YYYY").format('dddd');
                        expensesPerDay[day] += parseInt(model.get('value'));
                    }
                }
            });
            data = {
                labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                datasets: [
                    {
                        label: "Expenses",
                        fillColor: "rgba(220,220,220,0.2)",
                        strokeColor: "rgba(220,220,220,1)",
                        pointColor: "rgba(220,220,220,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(220,220,220,1)",
                        data: []
                    }
                ]
            };
            i = 0;
            for (day in expensesPerDay) {
                data['datasets'][0]['data'][i] = expensesPerDay[day];
                i++;
            }
            var options = {
                responsive: true
            };
            expensesLineChart = new Chart(lineCtx).Line(data,options);
        }
    },
    createIncomePieChart: function (model) {
        var incomeCategories = {}, i = 0, incomeData = {};
        entriesList.transactions.each(function (model) {
            var category = model.get('category');
            var value = model.get('value');
            if (model.get('type') == INCOME) {
                if (!incomeCategories.hasOwnProperty(category)) {
                    incomeCategories[category] = {};
                    incomeCategories[category]['value'] = 0;
                    var color = _.find(colors,{color_name: model.get('categoryColor')});
                    incomeCategories[category]['color'] = '#' + color['color_code'];
                    incomeCategories[category]['value'] += parseInt(value);
                } else {
                    incomeCategories[category]['value'] += parseInt(value);
                }
            }
        });
        var incomeCtx = $('#' + model.get('canvasId')).get(0).getContext("2d");

        $.map(incomeCategories, function (value, key) {
            incomeData[i] = {
                value: value['value'],
                color: value['color'],
                label: key
            };
            i++;
        });
        var options = {
            responsive: true,
            legend: {
                display: true
            }
        };
        var incomeChart = new Chart(incomeCtx).Doughnut(incomeData,options);
        $('.' + model.get('legendClass')).html(incomeChart.generateLegend());

    },
    createExpensePieChart: function (model) {
        var expenseCategories = {}, i = 0, expenseChart, expenseData = [];
        entriesList.transactions.each(function (model) {
            var category = model.get('category');
            var value = model.get('value');
            if (model.get('type') == EXPENSE) {
                if (!expenseCategories.hasOwnProperty(category)) {
                    expenseCategories[category] = {};
                    expenseCategories[category]['value'] = 0;
                    var color = _.find(colors,{color_name: model.get('categoryColor')});
                    expenseCategories[category]['color'] = '#' + color['color_code'];
                    expenseCategories[category]['value'] += parseInt(value);
                } else {
                    expenseCategories[category]['value'] += parseInt(value);
                }
            }
        });
        var expenseCtx = $('#' + model.get('canvasId')).get(0).getContext("2d");
        $.map(expenseCategories, function (value, key) {
            expenseData[i] = {
                value: value['value'],
                color: value['color'],
                label: key
            };
            i++;
        });
        var options = {
            responsive: true,
            maintainAspectRatio: true
        };
        expenseChart = new Chart(expenseCtx).Doughnut(expenseData,options);
        $('.' + model.get('legendClass')).html(expenseChart.generateLegend());
    },
    createExpensesLineChart: function(model) {
        var expensesPerMonthData, expensesPerMonthCtx, expensesPerMonthChart, i;
        var dataPerMonth = {
            "January": 0,
            "February": 0,
            "March": 0,
            "April": 0,
            "May": 0,
            "June": 0,
            "July": 0,
            "August": 0,
            "September": 0,
            "October": 0,
            "November": 0,
            "December": 0
        }
        expensesPerMonthData = {
            labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            datasets: [
                {
                    label: "Expenses per month",
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: [],
                }
            ]
        };
        entriesList.transactions.each(function(model) {
            var date = model.get('date');
            if(date) {
                var month = moment(date,"D-MMMM-YYYY").format('MMMM');
                dataPerMonth[month] += parseInt(model.get('value'));
            }
        });
        i = 0;
        for(var month in dataPerMonth) {
            expensesPerMonthData['datasets'][0]['data'][i] = dataPerMonth[month];
            i++;
        }
        var options = {
            responsive: true,
            maintainAspectRatio: false
        };
        expensesPerMonthCtx = $('#' + model.get('canvasId')).get(0).getContext('2d');
        expensesPerMonthChart = new Chart(expensesPerMonthCtx).Line(expensesPerMonthData,options);
    }
});