(function() {
    'use strict';





    var initialState = {
        todos: {},
        visibilityFilter: 'SHOW_ALL',
        nextTodoId: 1
    };

    var reducer = function(state, action) {
      switch(action.type) {

        case 'CREATE_TODO':
          var id = state.nextTodoId;
          var todo = {
            [id]: {
              id: state.nextTodoId,
              name: action.name,
              completed: false,
              created: Date.now()
            }
          };
          return Object.assign({}, state, {
            todos: Object.assign({}, state.todos, todo),
            nextTodoId: id + 1
          });
          break;

        case 'UPDATE_TODO':
          var todo = {
            [action.id]: Object.assign({}, state.todos[action.id], {
              name: action.name
            })
          }
          return Object.assign({}, state, {
            todos: Object.assign({}, state.todos, todo)
          });
          break;

        case 'REMOVE_TODO':
          var todos = state.todos;
          delete todos[action.id];
          return Object.assign({}, state, {
            todos: todos
          });
          break;

        default:
          return state;
          break;
      }
    };



    var actions = [
      {type: 'CREATE_TODO', name: 'Buy Milk' },
      {type: 'CREATE_TODO', name: 'Walk the Dog'},
      {type: 'CREATE_TODO', name: 'Buy a Car'},
      {type: 'REMOVE_TODO', id: 2},
      {type: 'UPDATE_TODO', id: 1, name: 'Buy more milk'}
    ];

    var TodoApp = actions.reduce(reducer, initialState);

    // console.log(globalState);






    // var TodoApp = {};

    var TodoListElement = document.getElementById('TodoList');

    function addTask(task) {
        var id = TodoApp.nextTodoId;
        var taskObject = {
            id: id,
            name: task,
            completed: false,
            created: Date.now()
        }
        TodoApp.todos[id] = taskObject;
        TodoApp.nextTodoId++;
    }

    function updateTask(id, task) {
        TodoApp.todos[id].name = task;
    }

    function removeTask(id) {
        delete TodoApp.todos[id];
    }

    function toggleTask(id) {
        TodoApp.todos[id].completed = !TodoApp.todos[id].completed;
    }

    function updateStore() {
        localStorage.setItem('TodoApp', JSON.stringify(TodoApp));
    }

    function renderTaskList() {
        var collection;
        var html = '<ul>';
        var visibilityClass = 'show-all';
        var todosAsArray = Object.values(TodoApp.todos);
        var total = todosAsArray.length;
        var activeItems = todosAsArray.filter(function(item) { return item.completed === false });
        var completeItems = todosAsArray.filter(function(item) { return item.completed === true });
        var stats = activeItems.length + ' items left';
        var filterContainer = document.getElementById('filter');

        updateStore();

        switch(TodoApp.visibilityFilter) {
            case 'SHOW_COMPLETED':
                collection = completeItems;
                visibilityClass = 'show-completed';
                break;
            case 'SHOW_ACTIVE':
                collection = activeItems;
                visibilityClass = 'show-active';
                break;
            default:
                collection = todosAsArray;
                collection.sort(function(a,b) {
                    if(a.completed != b.completed) {
                        return a.completed - b.completed;
                    } else {
                        return a.id - b.id;
                    }
                });
                break;
        }

        collection.forEach(function(item) {
            html += '<li id="item_' + item.id + '">';
            html += '<input class="checkbox" type="checkbox" id="ID_' + item.id + '"';
            if(item.completed) {
                html += ' checked';
            }
            html += '><label for="ID_' + item.id + '">';
            html += '<span class="content">';
            html += item.name;
            html += '</span>';
            html += '</label><div class="remove-item">&times;</div>';
            html += '</li>';
        });
        html += '</ul>';
        TodoListElement.innerHTML = html;


        if(activeItems.length === 0) {
            if(completeItems.length > 0) {
                stats = 'Congratulations! All Tasks completed!';
            } else {
                stats = 'Start Your Productivity! Add some tasks now.';
            }
        }
        document.getElementById('items-left').innerHTML = stats;

        filterContainer.classList.remove('show-all', 'show-completed', 'show-active');
        filterContainer.classList.add(visibilityClass);


    }

    function storageAvailable(type) {
        try {
            var storage = window[type],
                x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        }
        catch(e) {
            return false;
        }
    }



    document.getElementById('get-value').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log(e);
        var inputField = document.getElementById('input-field');
        var userInput = inputField.value;
        if(userInput) {
            console.log(userInput);

            TodoApp = reducer(TodoApp, {
              type: 'CREATE_TODO',
              name: 'yes'
            });

            //addTask(userInput);
            inputField.value = '';
            renderTaskList();
        }
    });

    TodoListElement.addEventListener('click', function(e) {
        if(e.target.className == 'remove-item') {
            var id = e.target.parentElement.id.replace('item_', '');
            removeTask(id);
            renderTaskList();
        }
        if(e.target.className == 'checkbox') {
            var id = e.target.parentElement.id.replace('item_', '');
            toggleTask(id);
            renderTaskList();
        }
        if(e.target.className == 'content') {
            e.preventDefault();
            // console.log('now convert to input field', e);
            // console.log(e.target.innerText);
            var form = document.createElement('form');
            var inputField = document.createElement('input');
            inputField.setAttribute('type', 'text');
            inputField.setAttribute('value', e.target.innerText);
            form.append(inputField);
            e.target.parentNode.replaceChild(form, e.target);
            inputField.focus();
        }
    });

    TodoListElement.addEventListener('submit', function(e) {
        e.preventDefault();
        var id = e.target.parentNode.parentNode.id.replace('item_', '');
        updateTask(id, e.target.childNodes[0].value);
        renderTaskList();
    });

    document.getElementById('filter').addEventListener('click', function(e) {
        switch(e.target.id) {
            case 'show-all':
                TodoApp.visibilityFilter = 'SHOW_ALL';
                break;
            case 'show-active':
                TodoApp.visibilityFilter = 'SHOW_ACTIVE';
                break;
            case 'show-completed':
                TodoApp.visibilityFilter = 'SHOW_COMPLETED';
                break;
        }
        renderTaskList();
    });



    // if (storageAvailable('localStorage')) {
    //     if(!localStorage.getItem('TodoApp')) {
    //         TodoApp = {
    //             todos: {},
    //             visibilityFilter: 'SHOW_ALL',
    //             nextTodoId: 1
    //         };
    //         updateStore();
    //     } else {
    //         TodoApp = JSON.parse(localStorage.getItem('TodoApp'));
    //     }
    // }
    // else {
    //     // Too bad, no localStorage for us
    //     console.log('Too bad, no localStorage for us');
    // }

    //TodoApp = globalState;

    renderTaskList();



    window.TodoApp = TodoApp;
    window.state = TodoApp;

})();
