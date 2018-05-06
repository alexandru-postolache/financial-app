
App.Views.Register = Backbone.View.extend({
    events: {
        "click #submit": "submit"
    },
    initialize: function(){

    },
    render: function(){

    },
    submit: function(e){
        e.preventDefault();
        var data = [];
        console.log('ceva');
        data['username'] = $('#username').val();
        data['email'] = $('#email').val();
        data['password'] = $('#password').val();
        $.ajax({
            url: "api/register",
            method: "post",
            data: {username: data['username'], email: data['email'], password: data['password']},
            success: function(result){
                if(result.error) {
                    $('#email').addClass('invalid');
                    $('label[for=email]').attr('data-error',result.message);
                }else {
                    $('#submit').addClass('disabled');
                    $('#register-wrapper').fadeOut().remove();
                    router.navigate("dashboard", {trigger: true});
                }
            }
        });
    }
});

