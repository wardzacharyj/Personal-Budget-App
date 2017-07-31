


document.addEventListener("DOMContentLoaded", function(event) {


    var CREATE_MODE = 0;
    var DELETE_MODE = 1;
    var buttonMode = CREATE_MODE;

    var currentCost = 0;
    var intitSignal = 0;


    initCreateDialog();

    if(document.getElementsByTagName('title')[0].textContent !== 'uncategorized')
        initGraph();
    else
        document.getElementsByClassName('graph_holder')[0].classList.add('hidden');


    initListItemListeners();


    document.getElementById('cat-fab').addEventListener('click', fabListener);

    if(document.getElementsByTagName('title')[0].textContent !== 'uncategorized')
        document.getElementById('delete_cat').addEventListener('click', deleteCategory);



    var headerCheckbox = document.querySelector('table').querySelector('thead .mdl-data-table__select input');

    var headerCheckHandler = function(event) {
        var table = document.querySelector('table');
        var boxes = table.querySelectorAll('tbody .mdl-data-table__select');

        if (event.target.checked) {
            setButtonMode(DELETE_MODE);
            for (var i = 0, length = boxes.length; i < length; i++) {
              boxes[i].MaterialCheckbox.check();
            }
        }
        else {
            setButtonMode(CREATE_MODE);
            for (var i = 0, length = boxes.length; i < length; i++) {
              boxes[i].MaterialCheckbox.uncheck();
            }
        }
    };
    headerCheckbox.addEventListener('change', headerCheckHandler);


    /**
     * Switches button mode to create or delete
     * @param mode
     */
    function setButtonMode(mode){
        var btn = document.getElementById('cat-fab');

        if(mode == CREATE_MODE){
            buttonMode = CREATE_MODE;
            btn.classList.add('mdl-button--colored');
            btn.classList.remove('mdl-color--red-500');

            btn.firstElementChild.textContent = 'create'

        }
        else {
            buttonMode = DELETE_MODE;


            btn.classList.add('mdl-color--red-500');
            btn.classList.remove('mdl-button--colored');

            btn.firstElementChild.textContent = 'delete'

        }
    }


    /**
     *  Deletes the currently open category
     */
    function deleteCategory(){


        var xhr = new XMLHttpRequest();
        xhr.open("DELETE", '/cats?cat='+document.getElementsByTagName('title')[0].textContent, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            var res = JSON.parse(xhr.responseText);
            if(xhr.status !== 200){

            }
            if(res["completed"]){
                console.log("DELETE PURCHASE - DELETE: /cats?cat="+document.getElementsByTagName('title')[0].textContent);
                console.log('RECEIVED: ');
                console.log(res);
                console.log("--------------------------------");


                window.location.replace('/')

            }
            else {
                // signal('Failed to delete purchase');
            }
        };

        xhr.send(null);
    }


    /**
     *  Initializes dialog listeners
     *
     */
    function initCreateDialog(){
        var createOption = document.getElementById('create_dialog');
        var dismissOption = document.getElementById('dismiss_dialog');
        var dialog = document.querySelector('dialog');

        document.getElementById('new_purchase_name_field').addEventListener('input', isValidForm);
        document.getElementById('new_purchase_cost_field').addEventListener('input', isValidForm);
        document.getElementById('new_purchase_date_field').addEventListener('input', isValidForm);

        createOption.addEventListener('click', function() {
            requestCreatePurchase(
                document.getElementById('new_purchase_name_field').value,
                document.getElementsByTagName('title')[0].textContent,
                document.getElementById('new_purchase_cost_field').value,
                document.getElementById('new_purchase_date_field').value
            );
            dialog.close();

            document.getElementById('new_purchase_name_field').value = '';
            document.getElementById('new_purchase_cost_field').value = '';
            document.getElementById('new_purchase_date_field').value = '';

            (document.getElementById('new_purchase_name_field').parentNode).MaterialTextfield.checkDirty();
            (document.getElementById('new_purchase_name_field').parentNode).MaterialTextfield.change();

            (document.getElementById('new_purchase_cost_field').parentNode).MaterialTextfield.checkDirty();
            (document.getElementById('new_purchase_cost_field').parentNode).MaterialTextfield.change();

            (document.getElementById('new_purchase_date_field').parentNode).MaterialTextfield.checkDirty();
            (document.getElementById('new_purchase_date_field').parentNode).MaterialTextfield.change();
        });

        dismissOption.addEventListener('click', function(){
            dialog.close();

            document.getElementById('new_purchase_name_field').value = '';
            document.getElementById('new_purchase_cost_field').value = '';
            document.getElementById('new_purchase_date_field').value = '';

            (document.getElementById('new_purchase_name_field').parentNode).MaterialTextfield.checkDirty();
            (document.getElementById('new_purchase_name_field').parentNode).MaterialTextfield.change();

            (document.getElementById('new_purchase_cost_field').parentNode).MaterialTextfield.checkDirty();
            (document.getElementById('new_purchase_cost_field').parentNode).MaterialTextfield.change();

            (document.getElementById('new_purchase_date_field').parentNode).MaterialTextfield.checkDirty();
            (document.getElementById('new_purchase_date_field').parentNode).MaterialTextfield.change();
        });
    }


    /**
     *  This is the button listener for floating action button
     *
     */
    function fabListener(){
        if(buttonMode == CREATE_MODE){
            document.querySelector('dialog').showModal();
        }
        else {
            var arrayOfAllCheckboxes = document.querySelectorAll('tbody input');
            var totalCost = 0;
            var deletionArray = [];
            for(var i = 0; i < arrayOfAllCheckboxes.length; i++){

                if(arrayOfAllCheckboxes[i].checked){
                    deletionArray.push(arrayOfAllCheckboxes[i].id);
                    totalCost+= parseInt(arrayOfAllCheckboxes[i].parentNode.parentNode.parentNode.firstElementChild
                        .nextElementSibling.nextElementSibling.nextElementSibling.textContent.substring(1));

                }
            }

            requestDeletePurchases(document.getElementsByTagName('title')[0].textContent, deletionArray, totalCost);
        }
    }


    /**
     *  Validates form before attempting POST in order to create new Purchase
     */
    function isValidForm(){

        var createButton = document.getElementById('create_dialog');

        var pNameField = document.getElementById('new_purchase_name_field');
        var pCostField = document.getElementById('new_purchase_cost_field');
        var pDateField = document.getElementById('new_purchase_date_field');


        if(pNameField.value.length > 0 && checkDuplicateName(pNameField.value) &&
            pCostField.validity.valid && pCostField.value.length > 0 && pDateField.validity.valid){
            createButton.classList.remove('mdl-button--disabled');
        }
        else {
            createButton.classList.add('mdl-button--disabled');
        }

        /**
         *  Checks for redundant Category Creation
         *
         * @param proposedName  The current name in the form before submitting
         * @returns {boolean}   indicates whether category name already exists
         */
        function checkDuplicateName(proposedName){
            var allPurchaseNames = document.querySelectorAll('.mdl-data-table__cell--non-numeric');

            for (var i = 0; i < allPurchaseNames.length; i++) {
              if(allPurchaseNames[i].textContent == proposedName)
                  return false;
            }

            return true
        }

    }

    /**
     * This initializes the graph
     *
     */
    function initGraph(){
        setProgress(getCurrentCost()/getLimit())
    }


    /**
     *  This initializes all event listeners on initial list items
     *
     */
    function initListItemListeners(){
        var lists = document.querySelector('table').querySelectorAll('input');

        for(var i = 0; i < lists.length; i++){
            lists[i].addEventListener('change', checkListener);
        }
    }


    /**
     *
     *  Sends a delete request to the purchase endpoint
     *
     *  @param category   category for request
     *  @param purchases  json object containing one or more purchases to be deleted
     */
    function requestDeletePurchases(category, names, totalCost){

        var purchase_object = JSON.stringify(
            {
                cat: category,
                names: names
            }
        );

        var xhr = new XMLHttpRequest();
        xhr.open("DELETE", '/purchases', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            var res = JSON.parse(xhr.responseText);
            if(xhr.status !== 200){

            }
            if(res["completed"]){
                // signal('Deleted purchase');

                console.log("DELETE PURCHASE - DELETE: /purchases");
                console.log('SENT: ');
                console.log(purchase_object);
                console.log('RECEIVED: ');
                console.log(res);
                console.log("--------------------------------");

                removePurchases(names);
                setCurrentCost(getCurrentCost()-parseInt(totalCost));

                if(document.getElementsByTagName('title')[0].textContent === 'uncategorized'){
                    updateuUcategorizedLimitLabel();
                }
                else {
                    updateLimitLabel();
                    setProgress(getCurrentCost()/getLimit());
                }

            }
            else {
                // signal('Failed to delete purchase');
            }
        };

        xhr.send(purchase_object);
    }


    /**
     * Removes all dek purchases from the
     *
     * @param list
     */
    function removePurchases(list){
        for(var i = 0; i < list.length; i++){
            var parent = document.getElementById(list[i]).parentNode.parentNode.parentNode.parentNode;
            var child = document.getElementById(list[i]).parentNode.parentNode.parentNode;
            parent.removeChild(child);
            setButtonMode(CREATE_MODE);
        }
    }


    /**
     *      Sends Purchase creation Request and updates list upon successful
     *      response from the server
     *
     */
    function requestCreatePurchase(name, category, cost, date){

        var purchase_object = JSON.stringify(
            {
                name: name,
                category: category,
                cost: cost,
                date: date
            }
        );

        var xhr = new XMLHttpRequest();
        xhr.open("POST", '/purchases', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            var res = JSON.parse(xhr.responseText);
            if(xhr.status !== 200){

            }
            if(res["completed"]){

                console.log("CREATE PURCHASE - POST: /purchases");
                console.log('SENT: ');
                console.log(purchase_object);
                console.log('RECEIVED: ');
                console.log(res);
                console.log("--------------------------------");

                insertPurchase(name, cost, date);
                setCurrentCost(getCurrentCost()+parseInt(cost));

                if(document.getElementsByTagName('title')[0].textContent === 'uncategorized'){
                    updateuUcategorizedLimitLabel();
                }
                else {
                    updateLimitLabel();
                    setProgress(getCurrentCost()/getLimit());
                }


            }
            else {
                // signal('Failed to create new category');
            }
        };

        xhr.send(purchase_object);

    }

    /**
     *  Returns limit for current category
     */
    function getLimit(){
        var limitText = document.getElementById('limit_banner').textContent;
        return limitText.substring(limitText.lastIndexOf('$')+1, limitText.length)
    }


    /**
     * Get Current Cost for category
     */
    function getCurrentCost(){

        if(intitSignal == 0 && document.getElementsByTagName('title')[0].textContent !== 'uncategorized') {
            var costBanner = document.getElementById('limit_banner').textContent;
            var value = costBanner.substring(1, costBanner.indexOf('/'));
            currentCost = value;
            intitSignal = 1;
        }
        else if(intitSignal == 0){

            var costBanner = document.getElementById('limit_banner').textContent;
            currentCost = costBanner.substring(1);
            intitSignal = 1;
        }

        return parseInt(currentCost);
    }


    /**
     * Set Current Cost for category
     */
    function setCurrentCost(newCost){
        currentCost = newCost;

        if(currentCost > 0){
            document.getElementById('table_banner').textContent = 'Purchase Log';
            if(document.getElementsByTagName('table')[0].classList.contains('hidden')){
                document.getElementsByTagName('table')[0].classList.remove('hidden')
            }
        }
        else {
            document.getElementById('table_banner').textContent = 'No Purchases Logged';
            if(!document.getElementsByTagName('table')[0].classList.contains('hidden')){
                document.getElementsByTagName('table')[0].classList.add('hidden')
            }
        }


    }


    /**
     *  Adds a new purchase to the user interface
     *
     * @param name
     * @param cost
     * @param date
     */
    function insertPurchase(name, cost, date){

        if(document.getElementsByTagName('table')[0].classList.contains('hidden')){
            document.getElementsByTagName('table')[0].classList.remove('hidden');
            document.getElementById('limit_banner').classList.remove('hidden');
        }

        var parent = document.getElementsByTagName('tbody')[0];

        var newRow = document.createElement('tr');

        var checkCell = document.createElement('td');

            var label = document.createElement('label');
            label.classList.add('mdl-checkbox');
            label.classList.add('mdl-js-checkbox');
            label.classList.add('mdl-js-ripple-effect');
            label.classList.add('mdl-data-table__select');
            label.setAttribute('for',name);

                var input = document.createElement('input');
                input.setAttribute('type', 'checkbox');
                input.id = name;
                input.classList.add('mdl-checkbox__input');

            label.appendChild(input);

        checkCell.appendChild(label);


        var nameCell = document.createElement('td');
        nameCell.classList.add('mdl-data-table__cell--non-numeric');
        nameCell.textContent = name;


        var dateCell = document.createElement('td');
        dateCell.textContent = date;

        var costCell = document.createElement('td');
        costCell.textContent = '$'+cost;

        newRow.appendChild(checkCell);
        newRow.appendChild(nameCell);
        newRow.appendChild(dateCell);
        newRow.appendChild(costCell);
        parent.appendChild(newRow);

        componentHandler.upgradeDom();

        input.addEventListener('change', checkListener);

        setCurrentCost(getCurrentCost())

    }


    /**
     * Listens for any checkbox changes in order to change fab configuration
     *
     * @param item the event produced from
     */
    function checkListener(item){

        if(item.target.checked){
            setButtonMode(DELETE_MODE)
        }
        else {
            var selected = document.querySelectorAll('table input');
            for (var s = 0; s < selected.length; s++){
                if(selected[s].checked) return;
            }
            setButtonMode(CREATE_MODE);

        }
    }


    /**
     * Update limit label
     */
    function updateLimitLabel(){
        var limitLabel = document.getElementById('limit_banner');
        limitLabel.textContent = '$'+getCurrentCost()+' / $'+getLimit();
    }


    /**
     * Update uncategorized limit label
     */
    function updateuUcategorizedLimitLabel(){
        var limitLabel = document.getElementById('limit_banner');
        limitLabel.textContent = '$'+getCurrentCost();
    }

     /**
     * Initializes the progress bar of a category card
     *
     * @param progress  the percentage of limit (specify with floats)
     */
    function setProgress(progress){
        var container = document.getElementsByClassName('graph_holder')[0];
        while (container.hasChildNodes()) {
            container.removeChild(container.lastChild);
        }
        var bar = new ProgressBar.SemiCircle(container, {
            strokeWidth: 6,
            color: '#fff',
            trailColor: '#e0e0e0',
            trailWidth: 1,
            easing: 'easeInOut',
            duration: 1400,
            svgStyle: null,
            text: {
                value: '',
                alignToBottom: false
            },
            from: {color: '#FB8C00'},
            to: {color:'#F44336'},
             // Set default step function for all animate calls
            step: (state, bar) => {
                bar.path.setAttribute('stroke', state.color);
                var value = Math.round(bar.value() * 100);
                if (value === 0) {
                    bar.setText('0%');
                } else {
                    bar.setText(value+"%");
                }
            bar.text.style.color = state.color;
          }
        });
        bar.text.style.fontFamily = '"Roboto", Helvetica, sans-serif';
        bar.text.style.fontSize = '2rem';

        bar.animate(progress);  // Number from 0.0 to 1.0
    }
});

