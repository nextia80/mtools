<!doctype html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
</head>
<body class="bg-light" data-spy="scroll" data-target=".navbar" data-offset="50">
    <div class="container">
        <div class="row">
            <div class="col-md-12 mb-3">
                <form id="LoadForm" name="LoadForm">
                    <h5 class="text-center">Lade Datensatz</h5>
                    <label for="load"></label>
                    <select class="custom-select d-block w-100" id="load" name="load">
                    </select>
                </form>
            </div>
        </div>
    </div>
    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    <script>
        // 1st Try
        // function populatedata() {
        // console.log("populatedata Executed!");
        //     $.getJSON('/data.php',
        //         function(data) {
        //             var select = $('#load');
        //             var options = select.prop('options');
        //             $('option', select).remove();
        //             $.each(data, function(index, array) {
        //                 options[options.length] = new Option(array['savename']);
        //             });
        //         });
        // }
        // 2nd Try
        // function populatedata() {
        //     console.log("populatedata Executed!");
        //     $.getJSON('/data.php',
        //         function(data) {
        //             console.log(data);
        //         });
        // }
        // 3rd Try
        function populatedata() {
            console.log("populatedata Executed!");
            $.getJSON('/data.php');
        }
        // Good for all Trys
        $(document).ready(function() {
            populatedata();
            $('#load').change(function() {
                populatedata();
            });
            $('#load').click(function() {
                populatedata();
            });
        });
    </script>
</body>
</html>