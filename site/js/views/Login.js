

App.Views.Login = Backbone.View.extend({
    className: "",
    events: {
        "click #submit": "submit"
    },
    initialize: function(){

    },
    render: function() {
        
    },
    submit: function(e){
        e.preventDefault();
        var data = [];
        data['email'] = $('#email').val();
        data['password'] = $('#password').val();
        $.ajax({
            url: "api/login",
            type: "post",
            data: { email: data['email'], password: data['password']},
            success: function(result){
                if(result.error) {
                    $('#error-wrapper').removeClass('hide');
                    $('#error-message').html(result.message);
                }else {
                    $('#submit').addClass('disabled');
                    $('#login-wrapper').fadeOut().remove();
                    router.navigate("dashboard", {trigger: true});
                }
            }
        });
    }
});

var lgnView = new App.Views.Login({el: $('#login')});