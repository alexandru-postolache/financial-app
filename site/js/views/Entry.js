var App = App || {
        Models: {},
        Views: {},
        Router: {},
        Collections: {}
};


_.extend(Backbone.Validation.callbacks, {
    valid: function (view, attr, selector) {

    },
    invalid: function (view, attr, error, selector) {
        var input = $('.modal #' + attr);
        var group = input.parent();
        group.find('label').attr('data-error', error);
        input.addClass('invalid');
    }
});
// BASIC ENTRY VIEW
App.Views.Entry = Backbone.View.extend({
    tagName: "tr",
    className: "",
    events: {
        'click #delete': "remove",
        'click #edit': "showEditModal"
    },
    template: new EJS({url: 'js/templates/entry.ejs'}),
    initialize: function () {
        _.extend(Backbone.Model.prototype, Backbone.Validation.mixin);
        Backbone.Validation.bind(this, {
            attributes: ['name', 'value']
        });
        this.model.on('hide', this.remove, this);
        this.model.on("change", this.render, this);
        $('#delete-modal #yesBtn').on("click", function () {
            $(this).data('clicked', true);
        });
    },
    render: function (event) {
        var attributes = this.model.toJSON();
        this.$el.html(this.template.render(attributes));
        return this;
    },
    remove: function () {
        var _this = this;
        $('#delete-modal').openModal({
            complete: function () {
                if ($('#delete-modal #yesBtn').data('clicked')) {
                    _this.model.destroy();
                    Materialize.toast("Entry has been deleted!", 2000);
                    _this.$el.remove();
                    expenseChartView = new App.Views.Chart({model: charts['expenseGraph']});
                    expenseChartView.model.trigger('change');
                }
                $('#delete-modal #yesBtn').data('clicked', false);
            }
        });
    },
    showEditModal: function (event) {
        var modal = new EJS({url: 'js/templates/modal.ejs'});
        var categories = new App.Collections.Categories();
        categories.fetch({async: false});
        if (this.model.get('type') == '1') {
            var categoriesList = categories.where({type: 1});
        } else {
            var categoriesList = categories.where({type: 2});
        }
        appView.$el.append(modal.render({type: 'edit', categories: categoriesList}));
        $('input#name').val(this.model.get('name'));
        $('input#value').val(this.model.get('value'));
        $('select#category').val(this.model.get('category_id'));
        $('input#date').val(this.model.get('date'));
        $('#modal').openModal({
            complete: function () {
                $('#modal').remove();
            }
        });
        $('select#category').material_select();
        $('.datepicker').pickadate({
            selectMonths: true,
            selectYears: 15,
            container: 'main'
        });
        $('#editEntry').click({model: this.model}, this.updateEntry);
    },
    updateEntry: function (event) {
        var name = $('input#name').val();
        var value = $('input#value').val();
        var category_id = $('select#category').val();
        var category_name = $('select#category option:selected').first().text();
        category_name = category_name.trim().replace(/(\r\n|\n|\r)/gm, "");
        var category = categories.where({name: category_name});
        var color = _.where(colors, {id: category[0].get('color_id')});
        var date = $('input#date').val();
            event.data.model.set({
                name: name,
                value: value,
                category_id: category_id,
                categoryColor: color[0]['color_name'],
                category: category_name,
                date: date
            }, {wait: true, silent: true});
        if (event.data.model.isValid()) {
            event.data.model.trigger('change');
            $('#modal').closeModal();
            $('#modal').remove();
            event.data.model.save();
            expenseChartView = new App.Views.Chart({model: charts['expenseGraph']});
            expenseChartView.model.trigger('change');
        }

    }
});
